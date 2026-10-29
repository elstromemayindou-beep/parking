import { createServer } from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { CanvasError, createCanvas, joinSession } from '@github/copilot-sdk/extension';
import { renderCanvasClient, renderCanvasPage } from './page.mjs';
import { readProjectState, taskIds, writeProjectState } from './storage.mjs';

const canvasId = 'autogestion-pro-admin';
const workspacePath = path.resolve(process.cwd());
const instances = new Map();

const send = (response, status, contentType, body) => {
  response.writeHead(status, {
    'content-type': contentType,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff'
  });
  response.end(body);
};

const fileExists = async filePath => {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw new CanvasError('canvas_project_file_check_failed', `Impossible de vérifier un fichier du projet : ${error.message}`);
  }
};

const getProjectStatus = async () => {
  let packageJson;
  try {
    packageJson = JSON.parse(await fs.readFile(path.join(workspacePath, 'package.json'), 'utf8'));
  } catch (error) {
    throw new CanvasError('canvas_project_metadata_failed', `Impossible de lire package.json : ${error.message}`);
  }
  const [workflowReady, svgLogoReady, windowsIconReady] = await Promise.all([
    fileExists(path.join(workspacePath, '.github', 'workflows', 'release.yml')),
    fileExists(path.join(workspacePath, 'public', 'autogestion-pro-logo.svg')),
    fileExists(path.join(workspacePath, 'public', 'autogestion-pro-logo.ico'))
  ]);
  return {
    version: typeof packageJson.version === 'string' ? packageJson.version : 'inconnue',
    workflowReady,
    svgLogoReady,
    windowsIconReady
  };
};

const getOverview = async () => {
  const [project, state] = await Promise.all([
    getProjectStatus(),
    readProjectState(workspacePath)
  ]);
  return { canvasId, workspace: workspacePath, ...project, checklist: state.checklist };
};

const updateChecklist = async input => {
  if (!input || typeof input !== 'object' || Array.isArray(input)
    || !taskIds.includes(input.task) || typeof input.checked !== 'boolean'
    || Object.keys(input).some(key => key !== 'task' && key !== 'checked')) {
    throw new CanvasError('canvas_invalid_input', 'Fournissez un élément de suivi reconnu et un état booléen.');
  }
  const state = await readProjectState(workspacePath);
  const updated = {
    ...state,
    checklist: { ...state.checklist, [input.task]: input.checked }
  };
  await writeProjectState(workspacePath, updated);
  return { task: input.task, checked: input.checked, checklist: updated.checklist };
};

const readRequestBody = async request => {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 2048) {
      throw new CanvasError('canvas_request_too_large', 'La requête est trop volumineuse.');
    }
  }
  try {
    return JSON.parse(body);
  } catch {
    throw new CanvasError('canvas_invalid_json', 'Le corps de la requête doit être un objet JSON valide.');
  }
};

const createInstanceServer = async instanceId => {
  const server = createServer(async (request, response) => {
    try {
      const address = server.address();
      const expectedHost = address && typeof address !== 'string' ? `127.0.0.1:${address.port}` : '';
      const expectedOrigin = `http://${expectedHost}`;
      if (request.headers.host !== expectedHost
        || (request.headers.origin && request.headers.origin !== expectedOrigin)) {
        return send(response, 403, 'application/json; charset=utf-8', JSON.stringify({ error: 'Origine de requête refusée.' }));
      }
      const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
      if (request.method === 'GET' && requestUrl.pathname === '/') {
        return send(response, 200, 'text/html; charset=utf-8', renderCanvasPage());
      }
      if (request.method === 'GET' && requestUrl.pathname === '/client.js') {
        return send(response, 200, 'text/javascript; charset=utf-8', renderCanvasClient());
      }
      if (request.method === 'GET' && requestUrl.pathname === '/logo.svg') {
        const logo = await fs.readFile(path.join(workspacePath, 'public', 'autogestion-pro-logo.svg'), 'utf8');
        return send(response, 200, 'image/svg+xml; charset=utf-8', logo);
      }
      if (request.method === 'GET' && requestUrl.pathname === '/api/status') {
        return send(response, 200, 'application/json; charset=utf-8', JSON.stringify(await getOverview()));
      }
      if (request.method === 'PUT' && requestUrl.pathname === '/api/checklist') {
        if (!request.headers['content-type']?.startsWith('application/json')) {
          throw new CanvasError('canvas_invalid_content_type', 'Le type de contenu doit être application/json.');
        }
        const result = await updateChecklist(await readRequestBody(request));
        return send(response, 200, 'application/json; charset=utf-8', JSON.stringify(result));
      }
      return send(response, 404, 'application/json; charset=utf-8', JSON.stringify({ error: 'Route introuvable.' }));
    } catch (error) {
      const isCanvasError = error instanceof CanvasError;
      const code = error instanceof Error ? error.code : undefined;
      const status = code === 'canvas_request_too_large' ? 413
        : code === 'canvas_invalid_json' || code === 'canvas_invalid_input' || code === 'canvas_invalid_content_type' ? 400
          : code === 'ENOENT' ? 404 : 500;
      const message = isCanvasError ? error.message : `Erreur du panneau : ${error instanceof Error ? error.message : String(error)}`;
      send(response, status, 'application/json; charset=utf-8', JSON.stringify({ error: message }));
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  instances.set(instanceId, server);
  const address = server.address();
  if (!address || typeof address === 'string') {
    await new Promise(resolve => server.close(resolve));
    instances.delete(instanceId);
    throw new CanvasError('canvas_server_failed', 'Le serveur local du panneau n’a pas fourni de port.');
  }
  return `http://127.0.0.1:${address.port}/`;
};

const stopInstance = async instanceId => {
  const server = instances.get(instanceId);
  if (!server) return;
  instances.delete(instanceId);
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
};

const canvas = createCanvas({
  id: canvasId,
  displayName: 'AutoGestion Pro — suivi projet',
  description: 'Consultez et cochez les contrôles du profil, des tarifs, du logo et des releases Windows AutoGestion Pro.',
  actions: [
    {
      name: 'getProjectReleaseStatus',
      description: 'Retourne la version, la configuration du logo, du workflow GitHub et la checklist du projet.',
      handler: () => getOverview()
    },
    {
      name: 'setReleaseChecklistItem',
      description: 'Marque comme vérifié ou à vérifier un élément du suivi de release.',
      inputSchema: {
        type: 'object',
        properties: {
          task: { type: 'string', enum: taskIds },
          checked: { type: 'boolean' }
        },
        required: ['task', 'checked'],
        additionalProperties: false
      },
      handler: ({ input }) => updateChecklist(input)
    }
  ],
  open: async ({ instanceId }) => {
    if (typeof instanceId !== 'string' || !instanceId) {
      throw new CanvasError('canvas_invalid_instance', 'Un identifiant de panneau est nécessaire.');
    }
    await readProjectState(workspacePath);
    await stopInstance(instanceId);
    return { url: await createInstanceServer(instanceId) };
  },
  onClose: async ({ instanceId }) => {
    try {
      await stopInstance(instanceId);
    } catch (error) {
      throw new CanvasError('canvas_server_close_failed', `Impossible d’arrêter le serveur du panneau : ${error.message}`);
    }
  }
});

const session = await joinSession({ canvases: [canvas] });
session.log('AutoGestion Pro project canvas connected.');
