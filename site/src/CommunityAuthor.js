import React from 'react';
import './components/styles.css';

const CommunityAuthor = ({
  name,
  imageUrl,
  twitterUrl,
  githubUrl,
  description,
}) => {
  return (
    <>
      <h2 className="communitySection">About the community author</h2>
      <div className="authorSection">
        <div className="authorImg">
          <img src={imageUrl} alt={name} />
        </div>
        <div className="authorDetails">
          <div className="authorName">
            <strong>{name}</strong>
            {twitterUrl ? (
              <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src="https://storage.googleapis.com/graphql-engine-cdn.hasura.io/learn-hasura/assets/social-media/twitter-icon.svg"
                  alt="Twitter Icon"
                  aria-label="Twitter"
                />
              </a>
            ) : null}
            {githubUrl ? (
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src="https://storage.googleapis.com/graphql-engine-cdn.hasura.io/learn-hasura/assets/social-media/github-icon.svg"
                  alt="Github Icon"
                  aria-label="Github"
                />
              </a>
            ) : null}
          </div>
          <div className="authorDesc">{description}</div>
        </div>
      </div>
    </>
  );
};

export default CommunityAuthor;
