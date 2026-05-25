import { api } from '../api';
import { Committee, CommitteeMember } from '../types';

interface UseCommitteeActionsParams {
  fetchData: () => Promise<void>;
  t: (key: string) => string;
}

export function useCommitteeActions({ fetchData }: UseCommitteeActionsParams) {
  const handleAddCommittee = async (data: Omit<Committee, 'id'>) => {
    try {
      await api.createCommittee(data);
      await fetchData();
    } catch (error) {
      console.error('Add committee error:', error);
    }
  };

  const handleUpdateCommittee = async (id: string, data: Partial<Committee>) => {
    try {
      await api.updateCommittee(id, data);
      await fetchData();
    } catch (error) {
      console.error('Update committee error:', error);
    }
  };

  const handleDeleteCommittee = async (id: string) => {
    try {
      await api.deleteCommittee(id);
      await fetchData();
    } catch (error) {
      console.error('Delete committee error:', error);
    }
  };

  const handleAddCommitteeMember = async (
    committeeId: string,
    member: Omit<CommitteeMember, 'id' | 'committeeId'>
  ) => {
    try {
      await api.addCommitteeMember(committeeId, member);
      await fetchData();
    } catch (error) {
      console.error('Add committee member error:', error);
    }
  };

  const handleRemoveCommitteeMember = async (committeeId: string, memberId: string) => {
    try {
      await api.removeCommitteeMember(committeeId, memberId);
      await fetchData();
    } catch (error) {
      console.error('Remove committee member error:', error);
    }
  };

  const handleImportCommittees = async (
    committees: Array<Omit<Committee, 'id'>>
  ): Promise<{ created: number; updated: number }> => {
    try {
      const result = await api.importCommittees(committees, true);
      await fetchData();
      return {
        created: result?.created || 0,
        updated: result?.updated || 0,
      };
    } catch (error) {
      console.error('Import committees error:', error);
      return { created: 0, updated: 0 };
    }
  };

  return {
    handleAddCommittee,
    handleUpdateCommittee,
    handleDeleteCommittee,
    handleAddCommitteeMember,
    handleRemoveCommitteeMember,
    handleImportCommittees,
  };
}
