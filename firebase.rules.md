
# Firebase Security Rules

Below are the recommended security rules for your Firebase project. You'll need to add these to your Firebase console.

## Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow public read for public collections
    match /public/{document=**} {
      allow read: if true;
    }
    
    // User profiles - allow read to all, write only to authenticated user for their own profile
    match /profiles/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User credits - restrict to authenticated users for their own data
    match /user_credits/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Image prompt history - only accessible to the user who created it
    match /image_prompt_history/{document} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if false; // Prompt history is immutable
    }
    
    // Generated images - accessible to creator only
    match /generated_images/{document} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // User preferences
    match /user_preferences/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Default deny all other access
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // User uploads
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Public images
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null; // Only authenticated users can upload to public
    }
    
    // Default deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## How to Apply These Rules

1. Go to your Firebase Console (https://console.firebase.google.com/)
2. Select your project (imagegen-7ce94)
3. For Firestore Rules:
   - Navigate to Firestore Database > Rules
   - Replace the existing rules with the Firestore rules provided above
   - Click "Publish"
4. For Storage Rules:
   - Navigate to Storage > Rules
   - Replace the existing rules with the Storage rules provided above
   - Click "Publish"

Remember to adjust these rules according to your specific security requirements.
