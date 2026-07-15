import { domainGet, domainPost } from "@/lib/domainApi";

export interface Endorsement {
  id: string;
  subjectId: string;
  authorId: string;
  authorName: string;
  authorRole: string;
  quote: string;
  projectId: string | null;
  projectName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEndorsementInput {
  subjectUserId: string;
  quote: string;
  projectId?: string;
}

export function fetchEndorsements(): Promise<Endorsement[]> {
  return domainGet<{ endorsements: Endorsement[] }>("/endorsements")
    .then(({ endorsements }) => endorsements);
}

export function createEndorsement(input: CreateEndorsementInput): Promise<Endorsement> {
  return domainPost<{ endorsement: Endorsement }>("/endorsements", input)
    .then(({ endorsement }) => endorsement);
}
