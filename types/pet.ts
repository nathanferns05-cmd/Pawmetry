export type Species =
  | "Dog"
  | "Cat"
  | "Bird"
  | "Rabbit"
  | "Other";

export type Gender =
  | "Male"
  | "Female";

// Matches the documents saved under users/{uid}/pets.
export interface Pet {
  id: string;
  petName: string;
  species: Species | string;
  breed: string;
  gender: Gender | string;
  age: number;
  weight: string;
  vaccinated: boolean;
  microchipped: boolean;
  petPhoto: string;
}
