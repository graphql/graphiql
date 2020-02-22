import { useSessionContext } from '../state/GraphiQLSessionProvider';

export default function useOperation() {
  const { operation } = useSessionContext();
  return operation;
}
