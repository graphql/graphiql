import * as React from 'react';

import { useStorageContext, useSchemaContext } from '@graphiql/react';
import { LAST_URL_KEY, PREV_URLS_KEY } from './constants';

const SelectServer = ({ url, setUrl }) => {
  const inputRef = React.useRef(null);
  const storage = useStorageContext();
  const lastUrl = storage?.get(LAST_URL_KEY);
  const [inputValue, setInputValue] = React.useState(lastUrl ?? url);
  const [previousUrls, setPreviousUrls] = React.useState(
    JSON.parse(storage?.get(PREV_URLS_KEY)) ?? [],
  );
  const [error, setError] = React.useState(null);

  const schema = useSchemaContext();

  const sameValue = inputValue.trim() === url;
  console.log(schema);

  return (
    <div>
      <div className="plugin-title">Select Server</div>
      <div>
        <input
          className="select-server--input"
          ref={inputRef}
          defaultValue={lastUrl ?? url}
          onChange={e => setInputValue(inputRef?.current?.value)}
        />
        {error ?? <div>{error}</div>}
      </div>
      <div>
        <button
          className={`select-server--button ${sameValue ? 'disabled' : ''}`}
          onClick={() => {
            const value = inputRef?.current?.value.trim();
            if (!value?.startsWith('http')) {
              setError('invalid url');
              return;
            }
            setError(null);
            setUrl(value);
            storage.set(LAST_URL_KEY, value);
            setInputValue(value);
            if (!previousUrls.includes(value)) {
              previousUrls.push(value);
              storage.set(PREV_URLS_KEY, JSON.stringify(previousUrls));

              setPreviousUrls(previousUrls);
            }
          }}
          disabled={sameValue}
          aria-disabled={sameValue}
        >
          Change Schema URL
        </button>
        {schema?.fetchError && (
          <div>
            <div className="select-server--schema-error">
              There was an error fetching your schema:
            </div>
            <div className="select-server--schema-error">
              <code>
                {JSON.parse(schema.fetchError).errors.map(({ message }) => (
                  <>{message}</>
                ))}
              </code>
            </div>
          </div>
        )}
        {schema?.schema && !schema?.isFetching && !schema?.fetchError && (
          <div className="select-server--schema-success">
            Schema retrieved successfully
          </div>
        )}
        {schema?.isFetching && (
          <div className="select-server--schema-loading">Schema loading...</div>
        )}
      </div>
      <div>
        <h3>Previous Severs</h3>
        <ul style={{ padding: 0 }}>
          {previousUrls.map(prev => {
            return (
              <li className="select-server--previous-entry" key={prev}>
                <span
                  onClick={() => {
                    storage.set(LAST_URL_KEY, prev);
                    inputRef.current.value = prev;
                    setError(null);
                    setUrl(prev);
                    setInputValue(value);
                  }}
                >
                  {prev}
                </span>
                <button
                  title="Delete server URL from history"
                  onClick={() => {
                    if (previousUrls.includes(prev)) {
                      const filteredPreviousUrls = previousUrls.filter(
                        url => url !== prev,
                      );
                      storage.set(
                        PREV_URLS_KEY,
                        JSON.stringify(filteredPreviousUrls),
                      );

                      setPreviousUrls(filteredPreviousUrls);
                    }
                  }}
                >
                  <svg
                    width="1em"
                    height="5em"
                    xmlns="http://www.w3.org/2000/svg"
                    fillRule="evenodd"
                    aria-hidden="true"
                    viewBox="0 0 23 23"
                    clipRule="evenodd"
                    style={{ height: '1em', width: '1em' }}
                  >
                    <title>trash icon</title>
                    <path
                      d="M19 24h-14c-1.104 0-2-.896-2-2v-17h-1v-2h6v-1.5c0-.827.673-1.5 1.5-1.5h5c.825 0 1.5.671 1.5 1.5v1.5h6v2h-1v17c0 1.104-.896 2-2 2zm0-19h-14v16.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-16.5zm-7 7.586l3.293-3.293 1.414 1.414-3.293 3.293 3.293 3.293-1.414 1.414-3.293-3.293-3.293 3.293-1.414-1.414 3.293-3.293-3.293-3.293 1.414-1.414 3.293 3.293zm2-10.586h-4v1h4v-1z"
                      fill="currentColor"
                      strokeWidth="0.25"
                      stroke="currentColor"
                    ></path>
                  </svg>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export function serverSelectPlugin({ url, setUrl }) {
  return {
    title: 'Select Server',
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth="1.5"
        stroke="currentColor"
      >
        <path d="M16.3788 6.20698C15.1885 5.25459 13.7434 4.5 12 4.5C7.85787 4.5 4.5 7.85786 4.5 12C4.5 16.1421 7.85787 19.5 12 19.5C15.2549 19.5 18.028 17.4254 19.0646 14.5256C19.2505 14.0055 19.775 13.6568 20.3153 13.7713L21.2935 13.9787C21.8338 14.0932 22.1836 14.6262 22.0179 15.1531C20.6787 19.4112 16.7016 22.5 12 22.5C6.20101 22.5 1.5 17.799 1.5 12C1.5 6.20101 6.20101 1.5 12 1.5C14.7835 1.5 16.9516 2.76847 18.5112 4.0746L20.2929 2.29289C20.5789 2.00689 21.009 1.92134 21.3827 2.07612C21.7564 2.2309 22 2.59554 22 3V8.5C22 9.05228 21.5523 9.5 21 9.5H15.5C15.0956 9.5 14.7309 9.25636 14.5761 8.88268C14.4214 8.50901 14.5069 8.07889 14.7929 7.79289L16.3788 6.20698Z" />
      </svg>
    ),
    content() {
      return <SelectServer url={url} setUrl={setUrl} />;
    },
  };
}
