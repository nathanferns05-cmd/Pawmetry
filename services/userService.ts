import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,  
} from "firebase/firestore";

import { auth, db } from "../config/firebaseConfig";

export async function saveOwnerProfile(data: {
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  emergencyContact: string;
}) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  await setDoc(
    doc(db, "users", uid),
    {
      fullName: data.fullName,
      phone: data.phone,
      country: data.country,
      state: data.state,
      city: data.city,
      emergencyContact: data.emergencyContact,
      email: auth.currentUser?.email || "",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );
}

export async function savePet(data: {
  petName: string;
  species: string;
  breed: string;
  gender: string;
  age: number;
  weight: string;
  vaccinated: boolean;
  microchipped: boolean;
  petPhoto: string;
}) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  await addDoc(collection(db, "users", uid, "pets"), {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function userProfileExists() {
  const uid = auth.currentUser?.uid;

  if (!uid) return false;

  const snapshot = await getDoc(doc(db, "users", uid));

  return snapshot.exists();
}

export async function getOwnerProfile(): Promise<{
  id: string;
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  emergencyContact: string;
  profilePhoto: string;
} | null> {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  const profileRef = doc(db, "users", uid);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    return null;
  }

  const data = snapshot.data();

  return {
    id: snapshot.id,
    fullName: String(data.fullName || ""),
    phone: String(data.phone || ""),
    country: String(data.country || ""),
    state: String(data.state || ""),
    city: String(data.city || ""),
    emergencyContact: String(data.emergencyContact || ""),
    profilePhoto: String(data.profilePhoto || ""),
  };
}

export async function updateOwnerProfile(data: {
  fullName: string;
  phone: string;
  country: string;
  state: string;
  city: string;
  emergencyContact: string;
}) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  await updateDoc(
    doc(db, "users", uid),
    {
      fullName: data.fullName,
      phone: data.phone,
      country: data.country,
      state: data.state,
      city: data.city,
      emergencyContact: data.emergencyContact,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function addMedication(
  petId: string,
  data: {
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    startDate: string;
    endDate: string;
    notes: string;
    active: boolean;
    notificationIds: string[];
  },
) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  const medicationRef = await addDoc(
    collection(db, "users", uid, "pets", petId, "medications"),
    {
      ...data,
      createdAt: serverTimestamp(),
    },
  );

  return medicationRef.id;
}

export async function getMedications(petId: string) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  const snapshot = await getDocs(
    collection(db, "users", uid, "pets", petId, "medications"),
  );

  return snapshot.docs.map((medication) => ({
    id: medication.id,
    ...medication.data(),
  }));
}

export async function updateMedication(
  petId: string,
  medicationId: string,
  data: {
    name: string;
    dosage: string;
    frequency: string;
    time: string;
    startDate: string;
    endDate: string;
    notes: string;
    active: boolean;
    notificationIds: string[];
  },
) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  await updateDoc(
    doc(
      db,
      "users",
      uid,
      "pets",
      petId,
      "medications",
      medicationId,
    ),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
  );
}

export async function deleteMedication(
  petId: string,
  medicationId: string,
) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  await deleteDoc(
    doc(
      db,
      "users",
      uid,
      "pets",
      petId,
      "medications",
      medicationId,
    ),
  );
}


export async function addPetPhoto(
  petId: string,
  data: {
    url: string;
    publicId: string;
  },
) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  const photoRef = await addDoc(
    collection(db, "users", uid, "pets", petId, "gallery"),
    {
      url: data.url,
      publicId: data.publicId,
      createdAt: serverTimestamp(),
    },
  );

  return photoRef.id;
}

export async function getPetPhotos(petId: string) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  const snapshot = await getDocs(
    collection(db, "users", uid, "pets", petId, "gallery"),
  );

  return snapshot.docs.map((photo) => ({
    id: photo.id,
    ...photo.data(),
  }));
}
export async function getUserPets() {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  const snapshot = await getDocs(collection(db, "users", uid, "pets"));

  return snapshot.docs.map((pet) => ({
    id: pet.id,
    ...pet.data(),
  }));
}

export async function updatePet(
  petId: string,
  data: {
    petName: string;
    species: string;
    breed: string;
    gender: string;
    age: number;
    weight: string;
    vaccinated: boolean;
    microchipped: boolean;
    petPhoto: string;
  },
) {
  const uid = auth.currentUser?.uid;

  if (!uid) {
    throw new Error("User not logged in");
  }

  await updateDoc(
    doc(db, "users", uid, "pets", petId),
    {
      ...data,
      updatedAt: serverTimestamp(),
    },
  );
}