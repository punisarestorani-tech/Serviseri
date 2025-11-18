import ClientCard from '../ClientCard';

export default function ClientCardExample() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <ClientCard
        clientId="1"
        name="Grand Hotel Plaza"
        email="maintenance@grandhotel.com"
        phone="+1 555-0123"
        applianceCount={12}
        onClick={() => console.log('Client clicked')}
      />
      <ClientCard
        clientId="2"
        name="Riverside Restaurant"
        email="manager@riverside.com"
        phone="+1 555-0456"
        applianceCount={8}
        onClick={() => console.log('Client clicked')}
      />
      <ClientCard
        clientId="3"
        name="Marina Bistro"
        email="contact@marinabistro.com"
        phone="+1 555-0789"
        applianceCount={5}
        onClick={() => console.log('Client clicked')}
      />
    </div>
  );
}
