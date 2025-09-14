// Create custom cursor elements
function createCustomCursor() {
  const cursor = document.createElement('div');
  cursor.className = 'custom-cursor';
  
  const cursorRing = document.createElement('div');
  cursorRing.className = 'cursor-ring';
  
  document.body.appendChild(cursor);
  document.body.appendChild(cursorRing);
  
  // Update cursor position
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    
    // Ring follows with slight delay
    cursorRing.style.left = e.clientX + 'px';
    cursorRing.style.top = e.clientY + 'px';
  });
  
  // Add hover effect for interactive elements
  const interactiveElements = document.querySelectorAll('button, .tile, a, input, .panel');
  
  interactiveElements.forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.classList.add('cursor-hover');
      cursorRing.classList.add('ring-hover');
    });
    
    el.addEventListener('mouseleave', () => {
      cursor.classList.remove('cursor-hover');
      cursorRing.classList.remove('ring-hover');
    });
  });
}

// Initialize when document loads
document.addEventListener('DOMContentLoaded', createCustomCursor);