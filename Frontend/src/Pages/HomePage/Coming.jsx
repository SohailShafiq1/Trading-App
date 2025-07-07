import React from 'react'
import { useTheme } from '../../Context/ThemeContext'

const Coming = () => {
  const { theme } = useTheme();

  return (
    <div
      style={{
        minHeight: "60vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: theme.background,
        color: theme.textColor,
        borderRadius: 20,
        boxShadow: "0 8px 32px rgba(16,160,85,0.10)",
        margin: "48px auto",
        maxWidth: 420,
        width: "95vw",
        padding: "clamp(32px,6vw,56px) clamp(16px,4vw,40px)",
        border: `1.5px solid ${theme.box || '#e0e0e0'}`,
        position: "relative",
      }}
    >
      <h2
        style={{
          fontSize: "clamp(2.1rem, 6vw, 2.7rem)",
          fontWeight: 900,
          marginBottom: 12,
          color: theme.textColor,
          letterSpacing: 1.3,
          textAlign: "center",
          lineHeight: 1.08,
          textShadow: "0 2px 8px rgba(16,160,85,0.07)",
        }}
      >
        🚧 Under Maintenance
      </h2>
      <h3
        style={{
          fontSize: "clamp(1.08rem, 2.8vw, 1.22rem)",
          color: theme.textColor,
          opacity: 0.92,
          textAlign: "center",
          marginBottom: 0,
          marginTop: 8,
          lineHeight: 1.6,
          maxWidth: 340,
          fontWeight: 500,
        }}
      >
        If you are experiencing any issues, please contact us on email.<br />
      </h3>
      <a
        href="https://mail.google.com/mail/?view=cm&fs=1&to=wealthxbroker@gmail.com"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#10a055",
          color: "#fff",
          borderRadius: "50%",
          width: 60,
          height: 60,
          margin: "18px auto 0 auto",
          boxShadow: "0 6px 24px #10a05533",
          fontWeight: 700,
          fontSize: 22,
          textDecoration: "none",
          transition: "background 0.2s, box-shadow 0.2s, transform 0.15s",
          cursor: "pointer",
          border: "2.5px solid #10a055",
          outline: "2px solid #10a05522",
          outlineOffset: 2,
        }}
        title="Contact us via Gmail"
        tabIndex={0}
        aria-label="Contact us via Gmail"
        onMouseOver={e => e.currentTarget.style.transform = 'scale(1.08)'}
        onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <span style={{ fontSize: 28, marginRight: 0 }}>✉️</span>
      </a>
    </div>
  )
}

export default Coming
