import { filterDocumentByOperationName } from '../src/filter-document';
import { FragmentDefinitionNode, Kind, OperationDefinitionNode, parse } from 'graphql';

describe('filterDocumentByOperationName', () => {
  it('should filter document with only 1 operation definition', () => {
    const document = parse(`
      fragment ItemFragment on Item { id }
      query GetItem($id: ID!) {
        item(id: $id) { ...ItemFragment }
      }
    `);

    const filteredDocument = filterDocumentByOperationName(document, 'GetItem');
    expect(filteredDocument.definitions.length).toEqual(2);

    const operationDefinition = filteredDocument.definitions.find(definition => 
      definition.kind === Kind.OPERATION_DEFINITION
    ) as OperationDefinitionNode | undefined;
    expect(operationDefinition?.name?.value).toEqual('GetItem');

    const fragmentDefinition = filteredDocument.definitions.find(definition => 
      definition.kind === Kind.FRAGMENT_DEFINITION
    ) as FragmentDefinitionNode | undefined;
    expect(fragmentDefinition?.name?.value).toEqual('ItemFragment');
  });

  it('should filter document with multiple operation definitions', () => {
    const document = parse(`
      fragment ItemFragment on Item { id }
      fragment UserFragment on User { id }
      fragment ReviewsFragment on Review { 
        id
        user { ...UserFragment } 
      }
      query GetItem($id: ID!) {
        item(id: $id) { ...ItemFragment }
      }
      query GetItemsAndReviews {
        reviews { ...ReviewsFragment }
        items { ...ItemFragment }
      }
    `);

    const filteredDocument = filterDocumentByOperationName(document, 'GetItemsAndReviews');
    expect(filteredDocument.definitions.length).toEqual(4);

    const operationDefinition = filteredDocument.definitions.find(definition => 
      definition.kind === Kind.OPERATION_DEFINITION
    ) as OperationDefinitionNode | undefined;
    expect(operationDefinition?.name?.value).toEqual('GetItemsAndReviews');

    const fragmentDefinitions = filteredDocument.definitions.filter(definition => 
      definition.kind === Kind.FRAGMENT_DEFINITION
    ) as FragmentDefinitionNode[] | undefined;
    expect(
      fragmentDefinitions?.map(def => def.name.value)
    ).toEqual(
      ['ReviewsFragment', 'UserFragment', 'ItemFragment']
    );
  });

  it('should filter document with multiple operations and 1 anonymous operation', () => {
    const document = parse(`
      fragment ItemFragment on Item { id }
      fragment UserFragment on User { id }
      fragment ReviewsFragment on Review { 
        id
        user { ...UserFragment } 
      }
      query GetItem($id: ID!) {
        item(id: $id) { ...ItemFragment }
      }
      query GetItemsAndReviews {
        reviews { ...ReviewsFragment }
        items { ...ItemFragment }
      }
      {
        reviews(ids: [1,2,3]) { ...ReviewsFragment }
      }
    `);

    const filteredDocument = filterDocumentByOperationName(document);
    expect(filteredDocument.definitions.length).toEqual(3);

    const operationDefinition = filteredDocument.definitions.find(definition => 
      definition.kind === Kind.OPERATION_DEFINITION
    ) as OperationDefinitionNode | undefined;
    expect(operationDefinition?.name?.value).toBeUndefined();

    const fragmentDefinitions = filteredDocument.definitions.filter(definition => 
      definition.kind === Kind.FRAGMENT_DEFINITION
    ) as FragmentDefinitionNode[] | undefined;
    expect(
      fragmentDefinitions?.map(def => def.name.value)
    ).toEqual(
      ['ReviewsFragment', 'UserFragment']
    );
  });

  it('should not filter document when no operation defitinion matches provided operation name', () => {
    const document = parse(`
      fragment ItemFragment on Item { id }
      fragment UserFragment on User { id }
      fragment ReviewsFragment on Review { 
        id
        user { ...UserFragment } 
      }
      query GetItem($id: ID!) {
        item(id: $id) { ...ItemFragment }
      }
      query GetItemsAndReviews {
        reviews { ...ReviewsFragment }
        items { ...ItemFragment }
      }
    `);

    const filteredDocument = filterDocumentByOperationName(document, 'MyAwesomeQuery');
    expect(filteredDocument.definitions.length).toEqual(0);
  });

  it('should not filter document without repeated fagment definitions', () => {
    const document = parse(`
      fragment ItemFragment on Item { id }
      query GetItem {
        item_1: item(id: 1) { ...ItemFragment }
        item_2: item(id: 2) { ...ItemFragment }
        item_3: item(id: 3) { ...ItemFragment }
        item_4: item(id: 4) { ...ItemFragment }
      }
    `);

    const filteredDocument = filterDocumentByOperationName(document, 'GetItem');
    expect(filteredDocument.definitions.length).toEqual(2);
  });
});
