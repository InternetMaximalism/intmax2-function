export interface PredicateRequest {
  from: string;
  to: string;
  data: string;
  msg_value: string;
  chain_id: number;
}

export interface PredicateResponse {
  is_compliant: boolean;
  task_id: string;
  expiry_block: number;
  signers: string[];
  signature: string[];
}
