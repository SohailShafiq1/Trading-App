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
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        margin: "40px auto",
        maxWidth: 480,
        padding: "48px 32px",
      }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          fontWeight: 700,
          marginBottom: 16,
          color: theme.textColor,
          letterSpacing: 1,
        }}
      >
        🚧 Coming Soon
      </h1>
      <p
        style={{
          fontSize: "1.2rem",
          color: theme.textColor,
          opacity: 0.85,
          textAlign: "center",
          marginBottom: 0,
        }}
      >
        We're working hard to bring you this feature.<br />
        <span style={{ color: theme.accent || "#10a055", fontWeight: 500 }}>
          Stay tuned!
        </span>
      </p>
    </div>
  )
}

export default Coming
