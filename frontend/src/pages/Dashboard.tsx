import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getUsers, getEmissions } from '../services/api'
import type { User, Emission } from '../types'

function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [emissions, setEmissions] = useState<Emission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUsers();
        const emissionsResponse = await getEmissions();
        setUsers(response.data);
        setEmissions(emissionsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, []);

  return (
    <div>
      <h1>Carbon Footprint Dashboard</h1>
      <div style={{ marginBottom: '20px' }}>
        <Link 
          to="/add-emission" 
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          + Add New Emission
        </Link>
      </div>
      <div>
        <h2>Users: {users.length}</h2>
        <h2>Emissions: {emissions.length}</h2>
        {/* Display the actual emissions data */}
        {emissions.map(emission => (
          <div key={emission.id}>
            {emission.category}: {emission.activity}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard