import { useState,useEffect } from 'react'
import './App.css'
import { getUsers, getEmissions } from './services/api'


function App() {
  interface User {
    id: number;
    username: string;
    email: string;
  }
  
  interface Emission {
    id: number;
    user_id: number;
    category: string;
    activity: string;
  }

  const [users, setUsers] = useState<User[]>([]);
  const [emissions, setEmissions] = useState<Emission[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUsers();
        const emissions = await getEmissions();
        setUsers(response.data);
        setEmissions(emissions.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
    fetchData();
  }, [users,emissions]);

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
