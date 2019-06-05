import { configure } from 'enzyme';
import Adapter from 'enzyme-adapter-react-15';

configure({ adapter: new Adapter() });

// document.createRange = () => ({
//   setEnd() {},
//   setStart() {},
//   getBoundingClientRect() {
//     return { right: 0 };
//   },
//   getClientRects() {
//     return { right: 0 };
//   },
// });
