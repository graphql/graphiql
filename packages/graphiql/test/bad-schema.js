export const badSchema = {
  __schema: {
    queryType: {
      name: 'Query',
    },
    mutationType: null,
    subscriptionType: null,
    types: [
      {
        kind: 'OBJECT',
        name: 'Query',
        description: null,
        fields: [
          {
            name: 'user',
            description: null,
            args: [
              {
                name: 'id',
                description: null,
                type: {
                  kind: 'NON_NULL',
                  name: null,
                  ofType: {
                    kind: 'SCALAR',
                    name: 'ID',
                    ofType: null,
                  },
                },
                defaultValue: null,
              },
            ],
            type: {
              kind: 'OBJECT',
              name: '<img src=x onerror=alert(document.domain)>',
              ofType: null,
            },
            isDeprecated: false,
            deprecationReason: null,
          },
        ],
        inputFields: null,
        interfaces: [],
        enumValues: null,
        possibleTypes: null,
      },
      {
        kind: 'SCALAR',
        name: 'ID',
        description: '',
        fields: null,
        inputFields: null,
        interfaces: null,
        enumValues: null,
        possibleTypes: null,
      },
      {
        kind: 'OBJECT',
        name: '<img src=x onerror=alert(document.domain)>',
        description: null,
        fields: [
          {
            name: 'name',
            description: null,
            args: [],
            type: {
              kind: 'NON_NULL',
              name: null,
              ofType: {
                kind: 'SCALAR',
                name: 'String',
                ofType: null,
              },
            },
            isDeprecated: false,
            deprecationReason: null,
          },
        ],
        inputFields: null,
        interfaces: [],
        enumValues: null,
        possibleTypes: null,
      },
      {
        kind: 'SCALAR',
        name: 'String',
        description: '',
        fields: null,
        inputFields: null,
        interfaces: null,
        enumValues: null,
        possibleTypes: null,
      },
    ],
    directives: [],
  },
};
