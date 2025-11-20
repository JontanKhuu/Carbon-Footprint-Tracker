import { useState,useEffect } from 'react'
import './App.css'
import { getUsers, getEmissions } from './services/api'
import type { User, Emission } from './types'


function App() {
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
    <>
      <h1>Carbon Footprint Tracker</h1>
      <div>
        <h2>Users: {users.length}</h2>
        <h2>Emissions: {emissions.length}</h2>
        {/* Or display the actual data */}
        {emissions.map(emission => (
          <div key={emission.id}>
            {emission.category}: {emission.activity}
          </div>
        ))}
      </div>
    </>
  )
}

export default App
