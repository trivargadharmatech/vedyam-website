with open('website/frontend/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

google_btn_html = """
      <div style="margin: 20px 0; text-align: center; color: var(--text-secondary);">OR</div>
      <button type="button" class="btn" onclick="window.__googleLogin()" style="width:100%; background:white; color:black; display:flex; align-items:center; justify-content:center; gap:10px;">
        <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
        Sign in with Google
      </button>
"""

content = content.replace("      </div>`;\n\n    if (!isLogin) {", "      </div>` + `" + google_btn_html + "`;\n\n    if (!isLogin) {")

otp_logic = """
window.__googleLogin = function() {
    const email = prompt('Enter your Gmail address to sign in with Google:');
    if (!email) return;
    
    const err = document.getElementById('authError');
    if (err) err.classList.add('hide');
    const label = document.getElementById('authBtnLabel');
    if (label) label.textContent = 'Sending OTP...';
    
    fetch(window.VEDYAM.API_BASE + '/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email })
    }).then(r => r.json()).then(data => {
        if (data.error) {
            if (err) { err.textContent = data.error; err.classList.remove('hide'); }
            if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
            return;
        }
        
        const otp = prompt('OTP sent to ' + email + '!\\nPlease check your inbox and enter the 6-digit code:');
        if (!otp) {
            if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
            return;
        }
        
        if (label) label.textContent = 'Verifying...';
        fetch(window.VEDYAM.API_BASE + '/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, code: otp })
        }).then(r => r.json()).then(verifyData => {
            if (verifyData.error) {
                if (err) { err.textContent = verifyData.error; err.classList.remove('hide'); }
                if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
                return;
            }
            
            localStorage.setItem('vedyam_token', verifyData.token);
            window.state.user = verifyData.user;
            window.location.hash = '#/profile';
        }).catch(e => {
            if (err) { err.textContent = 'Verification failed.'; err.classList.remove('hide'); }
            if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
        });
        
    }).catch(e => {
        if (err) { err.textContent = 'Failed to request OTP. Is backend running?'; err.classList.remove('hide'); }
        if (label) label.textContent = window.authMode === 'login' ? 'Sign In' : 'Create Account';
    });
};
"""

with open('website/frontend/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content + '\n' + otp_logic)
