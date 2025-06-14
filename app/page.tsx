// pages/index.js
"use client"

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Tesseract from 'tesseract.js';

// --- STYLING (So it doesn't look completely broken) ---
// We put this here to keep it all in one file for simplicity.
const styles = {
  container: { fontFamily: 'sans-serif', maxWidth: '800px', margin: '2rem auto', padding: '0 1rem' },
  header: { textAlign: 'center', borderBottom: '1px solid #ddd', paddingBottom: '1rem' },
  section: { backgroundColor: '#f9f9f9', padding: '1.5rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #eee' },
  sectionTitle: { marginTop: '0', borderBottom: '2px solid #0070f3', display: 'inline-block', paddingBottom: '0.5rem', marginBottom: '1rem' },
  button: { backgroundColor: '#0070f3', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem' },
  input: { padding: '8px', borderRadius: '5px', border: '1px solid #ccc', marginRight: '10px', width: '200px' },
  table: { width: '100%', borderCollapse: 'collapse', marginTop: '1rem' },
  th: { borderBottom: '2px solid #ddd', padding: '8px', textAlign: 'left', backgroundColor: '#f2f2f2' },
  td: { borderBottom: '1px solid #ddd', padding: '8px' },
  editableInput: { width: '90%', border: '1px solid #ccc', padding: '4px' },
  personCard: { border: '1px solid #ddd', borderRadius: '5px', padding: '1rem', marginBottom: '1rem' },
  spinner: { border: '4px solid #f3f3f3', borderTop: '4px solid #0070f3', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '20px auto' },
  '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } }
};

// --- MAIN APPLICATION COMPONENT ---
export default function HomePage() {
  // State Management
  const [menuImage, setMenuImage] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [people, setPeople] = useState([]);
  const [newPersonName, setNewPersonName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tax, setTax] = useState(10); // Default tax
  const [tip, setTip] = useState(15); // Default tip

  // --- CORE FUNCTIONS ---

  // 1. Handle image upload and trigger OCR
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setMenuImage(URL.createObjectURL(file));
    setIsLoading(true);
    setMenuItems([]); // Clear previous menu

    Tesseract.recognize(file, 'eng')
      .then(({ data: { text } }) => {
        setOcrText(text);
        parseMenuText(text);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
        alert('Error during OCR processing.');
      });
  };

  // 2. Parse the raw OCR text into a structured menu
  const parseMenuText = (text) => {
    const lines = text.split('\n');
    const items = [];
    // Regex to find prices (e.g., 25, 25k, 14.50) at the end of a line
    const priceRegex = /(\d+(?:[.,]\d{1,2})?)\s*K?$/i;

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      const match = trimmedLine.match(priceRegex);
      if (match) {
        const priceStr = match[1].replace(/,/g, '.'); // Normalize comma to dot
        const price = parseFloat(priceStr);
        const item = trimmedLine.substring(0, match.index).trim();
        if (item && !isNaN(price)) {
          items.push({ id: Date.now() + index, item, price });
        }
      }
    });
    setMenuItems(items);
  };
  
  // 3. Handle edits in the menu table
  const handleMenuChange = (id, field, value) => {
    setMenuItems(currentMenu => 
      currentMenu.map(item => 
        item.id === id ? { ...item, [field]: (field === 'price' ? parseFloat(value) || 0 : value) } : item
      )
    );
  };
  
  // 4. Add a person to the bill
  const addPerson = () => {
    if (newPersonName.trim() === '') return;
    setPeople([...people, { id: Date.now(), name: newPersonName.trim(), orders: [] }]);
    setNewPersonName('');
  };

  // 5. Assign an order to a person
  const addOrderToPerson = (personId, menuItemId) => {
    if (!menuItemId) return;
    const menuItem = menuItems.find(m => m.id === parseInt(menuItemId));
    setPeople(currentPeople =>
      currentPeople.map(p =>
        p.id === personId ? { ...p, orders: [...p.orders, menuItem] } : p
      )
    );
  };
  
  // 6. Calculate subtotal for a single person
  const calculateSubtotal = (orders) => {
    return orders.reduce((total, order) => total + order.price, 0);
  };

  // --- RENDER ---
  return (
    <>
      {/* We need this style tag for the spinner animation */}
      <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      <Head>
        <title>Menu Bill Splitter</title>
      </Head>
      <div style={styles.container}>
        <header style={styles.header}>
          <h1>Menu Bill Splitter</h1>
          <p>Upload a menu, assign orders, and split the bill perfectly.</p>
        </header>

        {/* --- STEP 1: UPLOAD --- */}
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
        
        {/* --- STEP 2: REVIEW MENU (Only shows after OCR) --- */}
        {menuItems.length > 0 && (
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Step 2: Review & Correct Menu</h2>
            <p>The AI has extracted the menu. Please correct any errors below.</p>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Item</th>
                  <th style={styles.th}>Price</th>
                </tr>
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

        {/* --- STEP 3: BUILD THE BILL (Only shows after menu is ready) --- */}
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
                    <h3>{person.name} - Subtotal: ${subtotal.toFixed(2)}</h3>
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
        
        {/* --- STEP 4: FINAL SUMMARY (Only shows if people have been added) --- */}
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
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Subtotal</th>
                  <th style={styles.th}>Total Due (inc. Tax & Tip)</th>
                </tr>
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