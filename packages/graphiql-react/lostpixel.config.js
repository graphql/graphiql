/** @type {import('lost-pixel').CustomProjectConfig} */
export default {
  storybookShots: {
    storybookUrl: './storybook-static',
  },
  imagePathBaseline: './.lostpixel/baseline',
  imagePathCurrent: './.lostpixel/current',
  imagePathDifference: './.lostpixel/difference',
  threshold: 0.001,
  failOnDifference: true,
  generateOnly: true,
  storybookConfig: {
    mask: [],
  },
};
