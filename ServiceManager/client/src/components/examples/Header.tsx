import Header from '../Header';

export default function HeaderExample() {
  return (
    <Header 
      username="John Smith" 
      onLogout={() => console.log('Logout clicked')} 
    />
  );
}
