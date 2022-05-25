import type { Editor, EditorChange } from 'codemirror';
import type { IHint } from 'codemirror-graphql/hint';
import { GraphQLSchema, GraphQLType, isListType, isNonNullType } from 'graphql';

import { ExplorerContextType } from '../explorer';
import { markdown } from '../markdown';
import { importCodeMirror } from './common';

/**
 * Render a custom UI for CodeMirror's hint which includes additional info
 * about the type and description for the selected context.
 */
export function onHasCompletion(
  _cm: Editor,
  data: EditorChange | undefined,
  schema: GraphQLSchema | null | undefined,
  explorer: ExplorerContextType | null,
) {
  importCodeMirror([], { useCommonAddons: false }).then(CodeMirror => {
    let information: HTMLDivElement | null;
    let fieldName: HTMLSpanElement | null;
    let typeNamePill: HTMLSpanElement | null;
    let typeNamePrefix: HTMLSpanElement | null;
    let typeName: HTMLAnchorElement | null;
    let typeNameSuffix: HTMLSpanElement | null;
    let description: HTMLDivElement | null;
    let deprecation: HTMLDivElement | null;
    let deprecationReason: HTMLDivElement | null;
    CodeMirror.on(
      data,
      'select',
      // @ts-expect-error
      (ctx: IHint, el: HTMLDivElement) => {
        // Only the first time (usually when the hint UI is first displayed)
        // do we create the information nodes.
        if (!information) {
          const hintsUl = el.parentNode as HTMLUListElement & ParentNode;

          // This "information" node will contain the additional info about the
          // highlighted typeahead option.
          information = document.createElement('div');
          information.className = 'CodeMirror-hint-information';
          hintsUl.appendChild(information);

          const header = document.createElement('header');
          header.className = 'CodeMirror-hint-information-header';
          information.appendChild(header);

          fieldName = document.createElement('span');
          fieldName.className = 'CodeMirror-hint-information-field-name';
          header.appendChild(fieldName);

          typeNamePill = document.createElement('span');
          typeNamePill.className = 'CodeMirror-hint-information-type-name-pill';
          header.appendChild(typeNamePill);

          typeNamePrefix = document.createElement('span');
          typeNamePill.appendChild(typeNamePrefix);

          typeName = document.createElement('a');
          typeName.className = 'CodeMirror-hint-information-type-name';
          typeName.href = 'javascript:void 0'; // eslint-disable-line no-script-url
          typeName.addEventListener('click', onClickHintInformation);
          typeNamePill.appendChild(typeName);

          typeNameSuffix = document.createElement('span');
          typeNamePill.appendChild(typeNameSuffix);

          description = document.createElement('div');
          description.className = 'CodeMirror-hint-information-description';
          information.appendChild(description);

          deprecation = document.createElement('div');
          deprecation.className = 'CodeMirror-hint-information-deprecation';
          information.appendChild(deprecation);

          const deprecationLabel = document.createElement('span');
          deprecationLabel.className =
            'CodeMirror-hint-information-deprecation-label';
          deprecationLabel.innerText = 'Deprecated';
          deprecation.appendChild(deprecationLabel);

          deprecationReason = document.createElement('div');
          deprecationReason.className =
            'CodeMirror-hint-information-deprecation-reason';
          deprecation.appendChild(deprecationReason);

          const handleScroll = () => {
            if (information) {
              information.style.paddingTop = hintsUl.scrollTop + 12 + 'px';
            }
          };
          hintsUl.addEventListener('scroll', handleScroll);

          // When CodeMirror attempts to remove the hint UI, we detect that it was
          // removed and in turn remove the information nodes.
          let onRemoveFn: EventListener | null;
          hintsUl.addEventListener(
            'DOMNodeRemoved',
            (onRemoveFn = (event: Event) => {
              if (event.target === hintsUl) {
                hintsUl.removeEventListener('scroll', handleScroll);
                hintsUl.removeEventListener('DOMNodeRemoved', onRemoveFn);
                if (information) {
                  information.removeEventListener(
                    'click',
                    onClickHintInformation,
                  );
                }
                information = null;
                fieldName = null;
                typeNamePill = null;
                typeNamePrefix = null;
                typeName = null;
                typeNameSuffix = null;
                description = null;
                deprecation = null;
                deprecationReason = null;
                onRemoveFn = null;
              }
            }),
          );
        }

        if (fieldName) {
          fieldName.innerText = ctx.text;
        }

        if (typeNamePill && typeNamePrefix && typeName && typeNameSuffix) {
          if (ctx.type) {
            typeNamePill.style.display = 'inline';

            const renderType = (type: GraphQLType) => {
              if (isNonNullType(type)) {
                typeNameSuffix!.innerText = '!' + typeNameSuffix!.innerText;
                renderType(type.ofType);
              } else if (isListType(type)) {
                typeNamePrefix!.innerText += '[';
                typeNameSuffix!.innerText = ']' + typeNameSuffix!.innerText;
                renderType(type.ofType);
              } else {
                typeName!.innerText = type.name;
              }
            };

            typeNamePrefix.innerText = '';
            typeNameSuffix.innerText = '';
            renderType(ctx.type);
          } else {
            typeNamePrefix.innerText = '';
            typeName.innerText = '';
            typeNameSuffix.innerText = '';
            typeNamePill.style.display = 'none';
          }
        }

        if (description) {
          if (ctx.description) {
            description.style.display = 'block';
            description.innerHTML = markdown.render(ctx.description);
          } else {
            description.style.display = 'none';
            description.innerHTML = '';
          }
        }

        if (deprecation && deprecationReason) {
          if (ctx.deprecationReason) {
            deprecation.style.display = 'block';
            deprecationReason.innerHTML = markdown.render(
              ctx.deprecationReason,
            );
          } else {
            deprecation.style.display = 'none';
            deprecationReason.innerHTML = '';
          }
        }
      },
    );
  });

  function onClickHintInformation(event: Event) {
    if (!schema || !explorer || !(event.currentTarget instanceof HTMLElement)) {
      return;
    }

    const typeName = event.currentTarget.innerText;
    const type = schema.getType(typeName);
    if (type) {
      explorer.show();
      explorer.push({ name: type.name, def: type });
    }
  }
}
