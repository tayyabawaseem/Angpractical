import { Component, OnInit } from '@angular/core';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    bootstrap: any;
  }
}

@Component({
  selector: 'app-cards',
  templateUrl: './cards.component.html',
  styleUrls: ['./cards.component.css'],
  standalone: true,
  imports: [HttpClientModule, FormsModule, CommonModule],
})
export class CardsComponent implements OnInit {
  notes: any[] = [];
  currentNote: any = { title: '', description: '', imageUrl: '' };
  alertMessage: string = '';
  alertType: string = 'alert-success'; // Default alert type
  isEditMode: boolean = false;
  selectedImage: File | null = null;

  private firebaseUrl = 'https://b2rykcrud-default-rtdb.asia-southeast1.firebasedatabase.app/notes';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.fetchNotes(); // Fetch notes on component initialization
  }

  // Fetch notes from the Firebase database
  fetchNotes() {
    this.http.get<{ [key: string]: any }>(`${this.firebaseUrl}.json`).subscribe(
      (res) => {
        const notesArray: any[] = [];
        for (const key in res) {
          if (res.hasOwnProperty(key)) {
            notesArray.push({ id: key, ...res[key] });
          }
        }
        this.notes = notesArray;
      },
      (error) => {
        console.error('Error fetching notes:', error);
        this.alertMessage = 'Failed to load notes!';
        this.alertType = 'alert-danger';
      }
    );
  }

  // Handle image selection
  onImageSelected(event: Event) {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length) {
      const file = fileInput.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        this.currentNote.imageUrl = e.target?.result as string; // Set image URL
      };
      reader.readAsDataURL(file);
    }
  }

  // Add a new note to the Firebase database
  onAddNote(form: NgForm) {
    if (form.valid) {
      const noteData = { ...form.value, imageUrl: this.currentNote.imageUrl }; // Include image URL
      this.http.post(`${this.firebaseUrl}.json`, noteData).subscribe(
        (res) => {
          console.log('Note Created:', res);
          this.fetchNotes(); // Fetch updated notes
          form.reset();
          this.currentNote.imageUrl = ''; // Reset image URL
          this.alertMessage = 'Note added successfully!';
          this.alertType = 'alert-success';
          this.closeModal('addNoteModel'); // Close modal after adding
        },
        (error) => {
          console.error('Error creating note:', error);
          this.alertMessage = 'Failed to add note!';
          this.alertType = 'alert-danger';
        }
      );
    }
  }

  // Open the edit modal with the selected note
  openEditModal(note: any) {
    this.currentNote = { ...note };
    this.isEditMode = true;
    const modal = new window.bootstrap.Modal(document.getElementById('editNoteModel'));
    modal.show();
  }

  // Update a note in the Firebase database
  onUpdateNote() {
    const noteData = { ...this.currentNote }; // Include image URL if needed
    this.http.put(`${this.firebaseUrl}/${this.currentNote.id}.json`, noteData).subscribe(
      (res) => {
        console.log('Note Updated:', res);
        this.fetchNotes(); // Fetch updated notes
        this.currentNote = { title: '', description: '', imageUrl: '' }; // Reset current note
        this.alertMessage = 'Note updated successfully!';
        this.alertType = 'alert-success';
        this.closeModal('editNoteModel'); // Close modal after editing
      },
      (error) => {
        console.error('Error updating note:', error);
        this.alertMessage = 'Failed to update note!';
        this.alertType = 'alert-danger';
      }
    );
  }

  // Delete a note from the Firebase database
  onDeleteNote(id: string) {
    this.http.delete(`${this.firebaseUrl}/${id}.json`).subscribe(
      (res) => {
        console.log('Note Deleted:', res);
        this.fetchNotes(); // Fetch updated notes
        this.alertMessage = 'Note deleted successfully!';
        this.alertType = 'alert-success';
      },
      (error) => {
        console.error('Error deleting note:', error);
        this.alertMessage = 'Failed to delete note!';
        this.alertType = 'alert-danger';
      }
    );
  }

  // Close modal
  closeModal(modalId: string) {
    const modal = new window.bootstrap.Modal(document.getElementById(modalId));
    modal.hide();
    this.alertMessage = ''; // Reset alert message on close
  }
}
