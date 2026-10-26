import { useState } from 'react';

function Contact() {
  // useState #1: Controlled input for capturing and displaying user message in real time
  const [message, setMessage] = useState('');
  
  // useState #2: Toggle visibility of an element (help / guide box)
  const [showHelp, setShowHelp] = useState(false);

  // Additional state for submitted feedback confirmation
  const [submittedMessage, setSubmittedMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim()) {
      setSubmittedMessage(message);
    }
  };

  const handleReset = () => {
    setMessage('');
    setSubmittedMessage('');
  };

  return (
    <div className="page-content contact-page">
      <div className="card">
        <h2>Contact & Feedback</h2>
        <p>Get in touch or leave feedback. This form demonstrates reactive state management with <code>useState</code>.</p>
        
        {/* Toggle UI Visibility using useState */}
        <div className="help-toggle-wrapper">
          <button 
            type="button" 
            className="toggle-help-btn"
            onClick={() => setShowHelp(!showHelp)}
          >
            {showHelp ? 'Hide Help & Tips ▴' : 'Show Help & Tips ▾'}
          </button>
          
          {showHelp && (
            <div className="help-box">
              <h4>💡 State Management Tips:</h4>
              <p>
                As you type in the text field below, the <code>message</code> state updates instantly via the <code>onChange</code> event handler. Notice how the live preview and character counter react synchronously without needing a page refresh!
              </p>
            </div>
          )}
        </div>

        {/* Controlled Form */}
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="messageInput">Your Message / Feedback:</label>
            <input
              id="messageInput"
              type="text"
              className="controlled-input"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            {/* Live character count below input */}
            <div className="input-meta">
              <span className="char-counter">
                Live Character Count: <strong>{message.length}</strong>
              </span>
              {message.length > 0 && (
                <button type="button" className="clear-btn" onClick={() => setMessage('')}>
                  Clear Input
                </button>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn" disabled={!message.trim()}>
              Submit Message
            </button>
            {(message || submittedMessage) && (
              <button type="button" className="reset-btn" onClick={handleReset}>
                Reset All
              </button>
            )}
          </div>
        </form>

        {/* Real-time display of user input */}
        <div className="live-preview-box">
          <h3>Real-time Input Preview:</h3>
          <div className="preview-display">
            {message ? (
              <span className="active-text">{message}</span>
            ) : (
              <span className="placeholder-text">Waiting for input... Type above to see real-time state synchronization.</span>
            )}
          </div>
        </div>

        {submittedMessage && (
          <div className="success-notification">
            ✓ Message submitted successfully: &ldquo;{submittedMessage}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}

export default Contact;
