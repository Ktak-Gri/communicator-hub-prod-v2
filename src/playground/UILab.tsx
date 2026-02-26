import HomePage from '../ui-lib/components/HomePage';

export default function UILab() {

  const mockNavigate = (page: any) => {
    console.log("navigate:", page);
  };

  return (
    <div style={{ padding: 40 }}>
      <HomePage onNavigate={mockNavigate} />
    </div>
  );
}