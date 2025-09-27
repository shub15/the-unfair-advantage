import os
import sys
from os import listdir
from os.path import isfile, join
from google.cloud import vision
import time
from PyQt5.QtWidgets import (QApplication, QWidget, QLabel, QPushButton, QHBoxLayout, QTextEdit, QFileDialog)
from PyQt5.QtGui import QPixmap

# Set GCP Vision API credentials
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = r"D:\gdgsc\ocr\vision_key.json"

def detect_text(path):
    client = vision.ImageAnnotatorClient()
    with open(path, "rb") as image_file:
        content = image_file.read()
    image = vision.Image(content=content)
    response = client.text_detection(image=image)
    texts = response.text_annotations
    
    if response.error.message:
        raise Exception(
            "{}\nFor more info on error messages, check: "
            "https://cloud.google.com/apis/design/errors".format(response.error.message)
        )

    return texts[0].description if texts else "No text detected"

class OCRApp(QWidget):
    def __init__(self):
        super().__init__()
        self.init_ui()

    def init_ui(self):
        # UI Elements
        self.image_label = QLabel("No Image Selected", self)
        self.image_label.setFixedSize(400, 300)
        self.image_label.setStyleSheet("border: 1px solid black;")

        self.text_output = QTextEdit(self)
        self.text_output.setReadOnly(True)

        self.select_file_button = QPushButton("Select Image File", self)
        self.select_file_button.clicked.connect(self.load_image_and_detect_text)

        # Layout Setup
        layout = QHBoxLayout()
        layout.addWidget(self.image_label)
        layout.addWidget(self.text_output)
        layout.addWidget(self.select_file_button)

        self.setLayout(layout)
        self.setWindowTitle("OCR Text Detection")
        self.setGeometry(200, 200, 700, 400)

    def load_image_and_detect_text(self):
        # Open File Dialog
        file_path, _ = QFileDialog.getOpenFileName(self, "Select Image File", "", "Images (*.png *.jpeg *.jpg *.bmp)")

        if file_path:
            # Display Image
            pixmap = QPixmap(file_path)
            scaled_pixmap = pixmap.scaled(self.image_label.width(), self.image_label.height())
            self.image_label.setPixmap(scaled_pixmap)
            
            # Perform OCR and display result
            try:
                ocr_text = detect_text(file_path)
                self.text_output.setPlainText(ocr_text)
            except Exception as e:
                self.text_output.setPlainText(f"Error: {str(e)}")

def main():
    app = QApplication(sys.argv)
    ocr_app = OCRApp()
    ocr_app.show()
    sys.exit(app.exec_())

if __name__ == "__main__":
    main()
