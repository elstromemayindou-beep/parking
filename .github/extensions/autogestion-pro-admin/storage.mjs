import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { CanvasError } from '@github/copilot-sdk/extension';

const FORMAT = 'autogestion-pro-admin-state';
const VERSION = 1;
const TASKS = ['tarifs', 'profil', 'logo', 'release'];

const dataDirectory = () => {
  const copilotHome = process.env.COPILOT_HOME || path.join(os.homedir(), '.copilot');
  return path.join(copilotHome, 'extension-data', 'autogestion-pro-admin');
};

const statePathFor = workspacePath => {
  const identity = crypto.createHash('sha256').update(workspacePath).digest('hex');
  return path.join(dataDirectory(), `${identity}.json`);
};

const isValidState = (value, workspacePath) =>
  value !== null
  && typeof value === 'object'
  && value.format === FORMAT
  && value.version === VERSION
  && value.workspacePath === workspacePath
  && value.checklist !== null
  && typeof value.checklist === 'object'
  && TASKS.every(task => typeof value.checklist[task] === 'boolean');

export const readProjectState = async workspacePath => {
  const filePath = statePathFor(workspacePath);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    let value;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new CanvasError('canvas_state_corrupt', 'Les données privées de ce projet sont illisibles; elles n’ont pas été remplacées.');
    }
    if (!isValidState(value, workspacePath)) {
      throw new CanvasError('canvas_state_unrecognized', 'Le format des données privées de ce projet n’est pas reconnu; elles n’ont pas été remplacées.');
    }
    return value;
  } catch (error) {
    if (error instanceof CanvasError) throw error;
    if (error?.code !== 'ENOENT') {
      throw new CanvasError('canvas_state_read_failed', `Impossible de lire l’état privé du projet : ${error.message}`);
    }
    const initial = {
      format: FORMAT,
      version: VERSION,
      workspacePath,
      checklist: { tarifs: false, profil: false, logo: false, release: false }
    };
    await writeProjectState(workspacePath, initial);
    return initial;
  }
};

export const writeProjectState = async (workspacePath, value) => {
  if (!isValidState(value, workspacePath)) {
    throw new CanvasError('canvas_state_invalid', 'L’état du projet fourni est invalide.');
  }
  const filePath = statePathFor(workspacePath);
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    try {
      await fs.rm(temporaryPath, { force: true });
    } catch (cleanupError) {
      if (cleanupError?.code !== 'ENOENT') {
        throw new CanvasError('canvas_state_cleanup_failed', `Échec de l’écriture de l’état (${error.message}) et du nettoyage temporaire (${cleanupError.message}).`);
      }
    }
    throw new CanvasError('canvas_state_write_failed', `Impossible d’enregistrer l’état privé du projet : ${error.message}`);
  }
};

export const taskIds = TASKS;
