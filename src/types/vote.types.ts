/**
 * Voting System Types
 */

export enum VoteType {
  RULE_CHANGE = 'RuleChange',
  MEMBER_EXPULSION = 'MemberExpulsion',
  ORDER_CHANGE = 'OrderChange',
  EXTENSION_REQUEST = 'ExtensionRequest',
  GENERAL = 'General',
}

export enum VoteStatus {
  OPEN = 'Open',
  CLOSED = 'Closed',
}

export enum VoteChoice {
  YES = 'Yes',
  NO = 'No',
  ABSTAIN = 'Abstain',
}

export interface Vote {
  id: string;
  tontineId: string;
  createdBy: string;
  creator?: {
    id: string;
    fullName: string;
    profilePhotoUrl?: string;
  };
  title: string;
  description?: string;
  voteType: VoteType;
  status: VoteStatus;
  requiredMajority: number; // 0.50 = 50%
  endDate: string;
  createdAt: string;
  results?: VoteResults;
}

export interface VoteResults {
  totalVotes: number;
  yesCount: number;
  noCount: number;
  abstainCount: number;
  yesPercentage: number;
  noPercentage: number;
  abstainPercentage: number;
  isPassing: boolean;
  hasReachedQuorum: boolean;
}

export interface VoteBallot {
  id: string;
  voteId: string;
  userId: string;
  user?: {
    id: string;
    fullName: string;
  };
  choice: VoteChoice;
  createdAt: string;
}

export interface CreateVoteData {
  tontineId: string;
  title: string;
  description?: string;
  voteType: VoteType;
  requiredMajority: number;
  durationHours: number; // How long the vote should stay open
}

export interface CastVoteData {
  voteId: string;
  choice: VoteChoice;
}
