# 👑 Queens Puzzle Game (Minimalist Edition)

A distraction-free, minimalist logic puzzle game based on the mathematical **N-Queens Backtracking Problem**, designed in an elegant **Black, Grey, and White** monochrome aesthetic.

---

## 📁 Project Directory
Saved on your PC at:
`C:\Users\Admin\Downloads\queens-game`

---

## 🎮 Game Structure & Features

1. **Main Menu**:
   - **New Game**: Launch setup and board configuration.
   - **Quit Game**: Clean farewell screen with quick return option.

2. **Game Setup**:
   - **Queens Input (N)**: Select quick presets (**4, 6, 8, 10, 12**) or type any custom number from $4$ to $16$.
   - **Select Level**:
     - **Easy**: Pre-places 1 safe Queen as a guide and visualizes attacked threat zones.
     - **Medium**: Standard N-Queens challenge with real-time conflict alert lines.
     - **Intermediate**: Pure chess puzzle test with no assists or conflict lines.

3. **In-Game Controls**:
   - **Click**: Place or remove a Queen crown.
   - **Right-Click / Mark (✕)**: Mark eliminated squares to deduce safe spots.
   - **💡 Hint**: Computes a safe move using the N-Queens backtracking algorithm and highlights the square.
   - **↩ Undo**: Step back your previous move.
   - **🔄 Clear**: Clear the board.
   - **← Menu**: Return to the main menu anytime.

4. **Monochrome Aesthetic**:
   - High-contrast pure black, matte graphite, and crisp white styling.
   - Completely distraction-free, zero extraneous laggy animations, instant responsive feedback.

---

## 🚀 How to Run

### Method 1: Double-click / Open in Browser
Directly double-click or open `index.html` in your favorite web browser (Chrome, Edge, Firefox, etc.).

### Method 2: Local Server
Run the built-in lightweight PowerShell server:
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080
```
Then visit: `http://localhost:8080`
