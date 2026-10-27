import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

const user = {
  name: 'Hedy Lamarr',
  imageUrl: 'https://react.dev/images/docs/scientists/yXOvdOSs.jpg',
  imageSize: 90,
};

function MyButton({
  globalCount,
  globalOnClick,
}: {
  globalCount: number;
  globalOnClick: () => void;
}) {
  const [count, setCount] = useState(0);

  // 1. React stores the new state value for this component instance
  // 2. Schedules a re-render
  // 3. Re-render execute (MyButton())
  function handleClick() {
    globalOnClick();
    setCount(count + 1);
  }

  return (
    <button onClick={handleClick}>
      Button was individually clicked {count} times
      All buttons were clicked {globalCount} times
    </button>
  );
}

const products = [
  { title: 'Cabbage', id: 1 },
  { title: 'Garlic', id: 2 },
  { title: 'Apple', id: 3 },
];

const listItems = products.map(product =>
  <li key={product.id}>
    {product.title}
  </li>
);

function App() {
  const [count, setCount] = useState(0);

  // 1. React stores the new state value for this component instance
  // 2. Schedules a re-render
  // 3. Re-render execute (MyButton())
  function globalOnClick() {
    setCount(count + 1);
  }

  return (
    <>
      <h1>{user.name}</h1>
      <img
        className="avatar"
        src={user.imageUrl}
        alt={'Photo of ' + user.name}
        style={{
          width: user.imageSize,
          height: user.imageSize
        }}
      />
      <MyButton globalCount={count} globalOnClick={globalOnClick} />
      <MyButton globalCount={count} globalOnClick={globalOnClick} />
      {listItems}
    </>
  );
}

export default App
