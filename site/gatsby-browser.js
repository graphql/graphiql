export const onServiceWorkerUpdateReady = () => {
  const answer = window.confirm(
    `This tutorial has been updated. ` +
      `Reload to display the latest version?`,
  );
  if (answer === true) {
    window.location.reload();
  }
};
require('prismjs/plugins/command-line/prism-command-line.css');
