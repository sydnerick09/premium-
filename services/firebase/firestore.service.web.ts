import { Project } from '../../types';

// Web stub — Firestore native SDK is not available on web in this config
class FirestoreServiceWeb {
  async saveProject(_userId: string, _project: Project) {}
  async deleteProject(_userId: string, _projectId: string) {}
  async getProject(_userId: string, _projectId: string): Promise<Project | null> { return null; }
  watchUserProjects(_userId: string, _cb: (projects: Project[]) => void) { return () => {}; }
  async incrementProjectsCount(_userId: string) {}
  async updateStorageUsed(_userId: string, _bytes: number) {}
  async setPremium(_userId: string, _expiry: string) {}
  async revokePremium(_userId: string) {}
}

export const firestoreService = new FirestoreServiceWeb();
