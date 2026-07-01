export const displayedEvidenceIds = (
  solved: boolean,
  retainedEvidenceIds: string[] | undefined,
  pendingEvidenceIds: string[]
): string[] => (solved ? retainedEvidenceIds ?? [] : pendingEvidenceIds);
