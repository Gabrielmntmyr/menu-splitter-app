/ app/page.tsx

"use client";

import { useState } from 'react';
import Head from 'next/head';
import Tesseract from 'tesseract.js';

// --- TYPE DEFINITIONS for TypeScript ---
interface MenuItem {
  id: number;
  item: string;
  price: number;
}

interface Person {
  id: number;
  name: string;
  orders: MenuItem[];
}


// --- STYLING ---
const styles: { [key: string]: React.CSSProperties } = {
  container: { fontFamily: 'sans-serif', maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' },
  header: { textAlign: 'center', borderBottom: '1px solid #ddd', paddingBottom: '1rem' },
  section: { backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #eee' },
  sectionTitle: { marginTop: '0', borderBottom: '2px solid #0070f3', display: 'inline-block', paddingBottom: '0.5rem', marginBottom: '1rem' },
  button: { backgroundColor: '#0070f3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem' },
  // --- NEW STYLE for the delete button ---
  deleteButton: { 
    backgroundColor: '#e53e3e', // A red color
    color: 'white', 
    border: 'none', 
    padding: '4px 10px', 
    borderRadius: '4px', 
    cursor: 'pointer', 
    fontSize: '0.8rem',
    marginLeft: '1rem'
  },
  input: { padding: '8px', borderRadius: '5px', border: '1px solid #ccc', marginRight: '10px', width: '200px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { borderBottom: '2px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' },
  td: { borderBottom: '1px solid #ddd', padding: '8px' },
  editableInput: { width: '90%', border: '1px solid #ccc', padding: '4px' },
  personCard: { border: '1px solid #ddd', borderRadius: '5px', padding: '1rem', marginBottom: '1rem' },
  personCardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' },
  spinner: { border: '4px solid #f3f3f3', borderTop: '4px solid #0070f3', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '20px auto' },
};

// --- MAIN APPLICATION COMPONENT ---
export default function HomePage() {
  // State Management
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tax, setTax] = useState(10); // Default tax
  const [tip, setTip] = useState(15); // Default tip

  // --- CORE FUNCTIONS ---

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setMenuItems([]);
    Tesseract.recognize(file, 'eng')
      .then(({ data: { text } }) => {
        parseMenuText(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
        alert('Error during OCR processing.');
      });
  };

  const parseMenuText = (text: string) => {
    const lines = text.split('\n');
    const items: MenuItem[] = [];
    const priceRegex = /(\d+(?:[.,]\d{1,2})?)\s*K?$/i;
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const match = trimmedLine.match(priceRegex);
      if (match) {
        const priceStr = match[1].replace(/,/g, '.');
        const price = parseFloat(priceStr);
        const item = trimmedLine.substring(0, match.index).trim();
        if (item && !isNaN(price)) {
          items.push({ id: Date.now() + index, item, price });
        }
      }
    });
    setMenuItems(items);
  };
  
  const handleMenuChange = (id: number, field: 'item' | 'price', value: string) => {
    setMenuItems(currentMenu => 
      currentMenu.map(item => 
        item.id === id ? { ...item, [field]: (field === 'price' ? parseFloat(value) || 0 : value) } : item
      )
    );
  };
  
  const addPerson = () => {
    if (newPersonName.trim() === '') return;
    setPeople([...people, { id: Date.now(), name: newPersonName.trim(), orders: [] }]);
    setNewPersonName('');
  };

  // --- NEW FUNCTION to delete a person ---
  const deletePerson = (personIdToDelete: number) => {
    setPeople(currentPeople =>
      currentPeople.filter(person => person.id !== personIdToDelete)
    );
  };

  const addOrderToPerson = (personId: number, menuItemId: string) => {
    if (!menuItemId) return;
    const menuItem = menuItems.find(m => m.id === parseInt(menuItemId));
    if(!menuItem) return;
    setPeople(currentPeople =>
      currentPeople.map(p =>
        p.id === personId ? { ...p, orders: [...p.orders, menuItem] } : p
      )
    );
  };
  
  const calculateSubtotal = (orders: MenuItem[]) => {
    return orders.reduce((total, order) => total + order.price, 0);
  };

  // --- RENDER ---
  return (
    <>
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <Head>
        <title>Menu Bill Splitter</title>
      </Head>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>Menu Bill Splitter</h1>
          <p>Upload a menu, assign orders, and split the bill perfectly.</p>
        </header>

        {/* ... (Step 1 and Step 2 sections remain the same) ... */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Step 1: Upload Menu</h2>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {isLoading && (
            <div>
              <p>Reading your menu... (This may take a moment)</p>
              <div style={styles.spinner}></div>
            </div>
          )}
        </section>
        
        {menuItems.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Step 2: Review & Correct Menu</h2>
            <p>The AI has extracted the menu. Please correct any errors below.</p>
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>Item</th><th style={styles.th}>Price</th></tr>
              </thead>
              <tbody>
                {menuItems.map(item => (
                  <tr key={item.id}>
                    <td style={styles.td}><input style={styles.editableInput} type="text" value={item.item} onChange={(e) => handleMenuChange(item.id, 'item', e.target.value)} /></td>
                    <td style={styles.td}><input style={styles.editableInput} type="number" step="0.01" value={item.price} onChange={(e) => handleMenuChange(item.id, 'price', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}


        {menuItems.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Step 3: Build the Bill</h2>
            <div>
              <input style={styles.input} type="text" value={newPersonName} onChange={(e) => setNewPersonName(e.target.value)} placeholder="Enter person's name" />
              <button style={styles.button} onClick={addPerson}>Add Person</button>
            </div>
            
            <div style={{marginTop: '1.5rem'}}>
              {people.map(person => {
                const subtotal = calculateSubtotal(person.orders);
                return (
                  <div key={person.id} style={styles.personCard}>
                    {/* --- UPDATED PART: Person header with delete button --- */}
                    <div style={styles.personCardHeader}>
                      <h3>{person.name} - Subtotal: ${subtotal.toFixed(2)}</h3>
                      <button style={styles.deleteButton} onClick={() => deletePerson(person.id)}>Delete</button>
                    </div>
                    <ul>
                      {person.orders.map((order, index) => (
                        <li key={index}>{order.item} - ${order.price.toFixed(2)}</li>
                      ))}
                    </ul>
                    <select onChange={(e) => addOrderToPerson(person.id, e.target.value)} style={{marginRight: '10px'}}>
                      <option value="">-- Assign new item --</option>
                      {menuItems.map(item => <option key={item.id} value={item.id}>{item.item} (${item.price})</option>)}
                    </select>
                  </div>
                )
              })}
            </div>
          </section>
        )}
        
        {/* ... (Step 4 section remains the same) ... */}
        {people.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Step 4: Final Summary</h2>
            <div>
              <label>Tax (%): </label>
              <input style={styles.input} type="number" value={tax} onChange={(e) => setTax(parseFloat(e.target.value) || 0)} />
              <label>Tip (%): </label>
              <input style={styles.input} type="number" value={tip} onChange={(e) => setTip(parseFloat(e.target.value) || 0)} />
            </div>
            
            <table style={styles.table}>
              <thead>
                <tr><th style={styles.th}>Name</th><th style={styles.th}>Subtotal</th><th style={styles.th}>Total Due (inc. Tax & Tip)</th></tr>
              </thead>
              <tbody>
                {people.map(person => {
                  const subtotal = calculateSubtotal(person.orders);
                  const totalDue = subtotal * (1 + tax / 100 + tip / 100);
                  return (
                    <tr key={person.id}>
                      <td style={styles.td}><strong>{person.name}</strong></td>
                      <td style={styles.td}>${subtotal.toFixed(2)}</td>
                      <td style={styles.td}><strong>${totalDue.toFixed(2)}</strong></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>
        )}
      </div>
    </>
  );
}