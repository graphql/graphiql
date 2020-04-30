import { useSessionContext } from '../providers/GraphiQLSessionProvider';

export default function useOperation() {
  const { operation } = useSessionContext();
  return operation;
}
