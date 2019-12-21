export const mockBadQuery = `bad {} query`;

export const mockQuery1 = /* GraphQL */ `
  query Test($string: String) {
    test {
      hasArgs(string: $string)
    }
  }
`;

export const mockQuery2 = /* GraphQL */ `
  query Test2 {
    test {
      id
    }
  }
`;

export const mockVariables1 = JSON.stringify({ string: 'string' });
export const mockVariables2 = JSON.stringify({ string: 'string2' });

export const mockOperationName1 = 'Test';
export const mockOperationName2 = 'Test2';

export const mockHistoryLabel1 = 'Test';
