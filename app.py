import os
from flask import Flask, render_template, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ambil password dari environment variable Docker (default: admin123)
DELETE_PASSWORD = os.environ.get('APP_PASSWORD', 'admin123')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/files', methods=['GET'])
def list_files():
    files = []
    for filename in os.listdir(UPLOAD_FOLDER):
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(filepath):
            stat = os.stat(filepath)
            files.append({
                'name': filename,
                'size': f"{stat.st_size / (1024 * 1024):.2f} MB" if stat.st_size > 1024*1024 else f"{stat.st_size / 1024:.2f} KB",
                'date': os.path.getmtime(filepath)
            })
    # Urutkan dari yang terbaru
    files.sort(key=lambda x: x['date'], reverse=True)
    return jsonify(files)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        return jsonify({'success': True, 'filename': filename})

@app.route('/download/<filename>', methods=['GET'])
def download_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

@app.route('/delete/<filename>', methods=['POST'])
def delete_file(filename):
    data = request.get_json()
    if data.get('password') != DELETE_PASSWORD:
        return jsonify({'error': 'Password salah, ninja! '}), 403
    
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    if os.path.exists(filepath):
        os.remove(filepath)
        return jsonify({'success': True})
    return jsonify({'error': 'File gak ada'}), 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)