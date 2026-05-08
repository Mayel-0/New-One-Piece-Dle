import React from 'react';

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0,0,0,0.7)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 30,
};

const modalStyle = {
  width: 'min(920px, 95vw)',
  background: '#f6e7c1',
  border: '4px solid #2f1c0f',
  borderRadius: '10px',
  padding: '20px',
  color: '#2f1c0f',
  boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
};

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '14px',
  marginTop: '14px',
};

const cardStyle = {
  background: '#f3dca1',
  border: '2px solid #2f1c0f',
  borderRadius: '8px',
  padding: '14px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
};

const badgeStyle = (type) => ({
  alignSelf: 'flex-start',
  padding: '2px 8px',
  borderRadius: '999px',
  border: '1px solid #2f1c0f',
  backgroundColor: type === 'malus' ? '#f7b0b0' : '#b8e3b8',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase',
});

const buttonStyle = {
  marginTop: 'auto',
  padding: '8px 10px',
  border: '2px solid #2f1c0f',
  background: '#2f1c0f',
  color: '#f6e7c1',
  cursor: 'pointer',
  borderRadius: '6px',
  fontWeight: 'bold',
};

const PowerUpModal = ({ isOpen, options, turnCount, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h2 style={{ margin: 0, textAlign: 'center' }}>⚓ Avis de Recherche: Power-Ups</h2>
        <p style={{ margin: '6px 0 0', textAlign: 'center' }}>
          Tour {turnCount} atteint. Choisis 1 pouvoir avant de continuer le duel.
        </p>

        <div style={gridStyle}>
          {options.map((powerup) => (
            <article key={powerup.id || powerup.code_effet} style={cardStyle}>
              <span style={badgeStyle(powerup.type)}>{powerup.type}</span>
              <h3 style={{ margin: 0 }}>{powerup.nom}</h3>
              <p style={{ margin: 0, minHeight: '60px' }}>{powerup.description}</p>
              <small>Code: {powerup.code_effet}</small>

              <button
                type="button"
                style={buttonStyle}
                onClick={() => onSelect(powerup)}
              >
                Choisir ce Power-Up
              </button>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PowerUpModal;
