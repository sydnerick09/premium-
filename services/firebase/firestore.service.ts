import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Project } from '../../types';

class FirestoreService {
  private col(name: string) {
    return firestore().collection(name);
  }

  // ─── Projects ──────────────────────────────────────────────────────────────
  async saveProject(project: Project): Promise<void> {
    await this.col('projects').doc(project.id).set(
      {
        ...project,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  async deleteProject(projectId: string): Promise<void> {
    await this.col('projects').doc(projectId).delete();
  }

  async getProject(projectId: string): Promise<Project | null> {
    const doc = await this.col('projects').doc(projectId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Project;
  }

  watchUserProjects(
    userId: string,
    callback: (projects: Project[]) => void
  ): () => void {
    return this.col('projects')
      .where('userId', '==', userId)
      .orderBy('updatedAt', 'desc')
      .limit(100)
      .onSnapshot((snap) => {
        const projects = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() } as Project)
        );
        callback(projects);
      });
  }

  async incrementProjectsCount(userId: string, delta = 1): Promise<void> {
    await this.col('users')
      .doc(userId)
      .update({
        projectsCount: firestore.FieldValue.increment(delta),
      })
      .catch(() => {});
  }

  async updateStorageUsed(userId: string, bytes: number): Promise<void> {
    await this.col('users')
      .doc(userId)
      .update({ storageUsedBytes: firestore.FieldValue.increment(bytes) })
      .catch(() => {});
  }

  // ─── Premium ───────────────────────────────────────────────────────────────
  async setPremium(userId: string, expiry: Date | null): Promise<void> {
    await this.col('users').doc(userId).update({
      isPremium: true,
      premiumExpiry: expiry
        ? firestore.Timestamp.fromDate(expiry)
        : null,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }

  async revokePremium(userId: string): Promise<void> {
    await this.col('users').doc(userId).update({
      isPremium: false,
      premiumExpiry: null,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    });
  }
}

export const firestoreService = new FirestoreService();
