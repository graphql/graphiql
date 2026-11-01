import 'cypress-each';

function colorChannels(document: Document, color: string) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d')!;
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
}

function contrast(first: number[], second: number[]) {
  function luminance(channels: number[]) {
    const [red, green, blue] = channels.map(channel => {
      const value = channel / 255;
      return value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  }
  const values = [luminance(first), luminance(second)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}

function checkSharedSelection(item: HTMLElement) {
  const document = item.ownerDocument;
  const rail = document.querySelector(
    '.graphiql-activity-rail-item[aria-pressed="true"]',
  )!;
  const logo = document.querySelector('.graphiql-top-bar-logo')!;
  const color = (value: string) => colorChannels(document, value);
  const logoColor = color(getComputedStyle(logo).fill);
  const railStyle = getComputedStyle(rail);
  const itemStyle = getComputedStyle(item);
  const background = color(itemStyle.backgroundColor);
  const marker = color(itemStyle.borderInlineStartColor);

  expect(logoColor, 'GraphQL logo pink').to.deep.equal([225, 0, 152]);
  expect(marker, 'selection marker matches logo').to.deep.equal(logoColor);
  expect(marker, 'shared selection marker').to.deep.equal(
    color(railStyle.borderInlineStartColor),
  );
  expect(background, 'shared selection tint').to.deep.equal(
    color(railStyle.backgroundColor),
  );
  expect(
    contrast(color(itemStyle.color), background),
    'selected text contrast',
  ).to.be.at.least(4.5);
  expect(
    contrast(marker, background),
    'selection marker contrast',
  ).to.be.at.least(3);
}

describe('Theme', () => {
  describe('`defaultTheme`', () => {
    it('should have light theme', () => {
      cy.visitGraphiQL({ defaultTheme: 'light' });
      cy.get('body').should('have.class', 'graphiql-light');
    });
    it('should have dark theme', () => {
      cy.visitGraphiQL({ defaultTheme: 'dark' });
      cy.get('body').should('have.class', 'graphiql-dark');
    });
  });

  it.each(['light', 'dark'] as const)(
    'keeps dropdown selection accessible and distinct from keyboard focus in %s mode',
    theme => {
      cy.visitGraphiQL(
        { query: 'query Alpha { __typename }\nmutation Change { __typename }' },
        {
          onBeforeLoad(win) {
            win.localStorage.setItem(
              'graphiql:settings',
              JSON.stringify({ theme }),
            );
          },
        },
      );
      cy.get('.graphiql-activity-rail-item')
        .first()
        .then($button => {
          if ($button.attr('aria-pressed') !== 'true') {
            cy.wrap($button).click();
          }
        });
      cy.get('.graphiql-top-bar-wordmark').realHover();
      cy.injectAxe();
      cy.get('[aria-label="Choose request method"]').focus();
      cy.realPress('Enter');
      cy.get('[role="menuitemradio"][aria-checked="true"]')
        .should('have.text', 'Auto')
        .as('selection');
      cy.checkA11y('[role="menu"]');

      cy.realPress('ArrowDown');
      cy.focused()
        .should('have.text', 'QUERY')
        .and('have.attr', 'aria-disabled', 'true')
        .and('have.attr', 'aria-checked', 'false')
        .should($item => {
          const style = getComputedStyle($item[0]);
          expect(style.outlineStyle).to.equal('solid');
          expect(parseFloat(style.outlineWidth)).to.be.at.least(2);
        });
      cy.get('@selection')
        .should('have.attr', 'aria-checked', 'true')
        .should($item => checkSharedSelection($item[0]));
      cy.get('[role="tooltip"]').should(
        'contain.text',
        'This server does not support QUERY.',
      );
      cy.realPress('Enter');
      cy.get('[role="menu"]').should('be.visible');
      cy.realPress('Escape');
      cy.focused().should('have.attr', 'aria-label', 'Choose request method');

      cy.get('[aria-label="Choose operation to run"]').focus();
      cy.realPress('Enter');
      cy.get('[role="menuitemradio"][aria-checked="true"]').should(
        'contain.text',
        'Alpha',
      );
      cy.checkA11y('[role="menu"]');
      cy.realPress('ArrowDown');
      cy.focused()
        .should('contain.text', 'Change')
        .and('have.attr', 'aria-checked', 'false');
      cy.get('[role="menuitemradio"][aria-checked="true"]').should($item =>
        checkSharedSelection($item[0]),
      );
      cy.realPress('Enter');
      cy.focused()
        .should('have.attr', 'aria-label', 'Choose operation to run')
        .and('contain.text', 'Change');

      cy.realPress('Enter');
      cy.get('[role="menuitemradio"][aria-checked="true"]').should(
        'contain.text',
        'Change',
      );
      cy.checkA11y('[role="menu"]');
      cy.realPress('Escape');
      cy.get('[aria-label="Choose request method"]').click();
      cy.get('[role="menuitemradio"][aria-checked="true"]').should(
        'have.text',
        'POST',
      );
      cy.checkA11y('[role="menu"]');
    },
  );

  it.each(['light', 'dark'] as const)(
    'keeps Run visually distinct from secondary controls on hover in %s mode',
    theme => {
      cy.visitGraphiQL(
        { query: '{ __typename }' },
        {
          onBeforeLoad(win) {
            win.localStorage.setItem(
              'graphiql:settings',
              JSON.stringify({ theme }),
            );
          },
        },
      );
      cy.get('.graphiql-container').should('have.attr', 'data-theme', theme);
      cy.get('.graphiql-execute-button-primary')
        .realHover()
        .then($button => {
          const runBackground = getComputedStyle($button[0]).backgroundColor;
          cy.get('[aria-label="Choose request method"]')
            .realHover()
            .should($method => {
              expect(getComputedStyle($method[0]).backgroundColor).not.to.equal(
                runBackground,
              );
            });
        });
    },
  );

  describe('Settings theme toggle', () => {
    function editorBackground() {
      return cy
        .get('.graphiql-editors')
        .then($el => getComputedStyle($el[0]).backgroundColor);
    }

    function openSettingsAndChooseTheme(theme: 'light' | 'dark') {
      cy.get('[aria-label="Settings"]').click();
      cy.get('.graphiql-dialog').should('be.visible');
      // The radio input itself is visually hidden (a custom-styled control),
      // so `check` is the reliable way to select it.
      cy.get(`input[type="radio"][value="${theme}"]`).check({ force: true });
      cy.get(`input[type="radio"][value="${theme}"]`).should('be.checked');
      // Assert the effect landed while the dialog is still open, before
      // closing it — closing and immediately reopening the dialog for the
      // next toggle races with Radix's dismiss/focus-return handling.
      cy.get('.graphiql-container').should('have.attr', 'data-theme', theme);
      cy.get('.graphiql-dialog-close').click();
      cy.get('.graphiql-dialog').should('not.exist');
    }

    beforeEach(() => {
      // The theme setting persists to localStorage and defaults to 'auto',
      // which depends on the OS color-scheme preference. Start every test
      // from an explicit, deterministic Dark baseline instead of inheriting
      // whatever the previous test (or the test runner's OS) prefers.
      cy.clearLocalStorage();
      cy.visitGraphiQL(
        {},
        {
          onBeforeLoad(win) {
            win.localStorage.setItem(
              'graphiql:settings',
              JSON.stringify({ theme: 'dark' }),
            );
          },
        },
      );
      cy.get('.graphiql-container').should('have.attr', 'data-theme', 'dark');
    });

    it('recolors the editor background, not just the syntax tokens, when switching to Light', () => {
      editorBackground().then(darkBackground => {
        openSettingsAndChooseTheme('light');

        // The bug this guards against: only the Monaco syntax tokens used to
        // recolor on toggle while `.graphiql-editors` kept its dark
        // background, because it was still painted by a legacy token that
        // the Settings-driven `data-theme` toggle never updated.
        editorBackground().should('not.equal', darkBackground);
      });
    });

    it('restores the dark editor background when switching back to Dark', () => {
      editorBackground().then(originalDarkBackground => {
        openSettingsAndChooseTheme('light');
        openSettingsAndChooseTheme('dark');

        editorBackground().should('equal', originalDarkBackground);
      });
    });
  });
});
