import prisma from '../../lib/prisma'; // Adjusted path
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session || !session.user || !session.user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const userId = session.user.id;

  if (req.method === 'GET') {
    try {
      const coupleProfile = await prisma.coupleProfile.findUnique({
        where: { userId },
      });

      if (!coupleProfile) {
        return res.status(404).json({ message: 'Couple profile not found' });
      }
      return res.status(200).json(coupleProfile);
    } catch (error) {
      console.error('Error fetching couple profile:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  } else if (req.method === 'POST') {
    try {
      const existingProfile = await prisma.coupleProfile.findUnique({
        where: { userId },
      });

      if (existingProfile) {
        return res.status(409).json({ message: 'Couple profile already exists for this user. Use PUT to update.' });
      }

      const { name1, name2, coupleImageURL, bio, interests, location } = req.body;

      if (!name1 || !name2) {
        return res.status(400).json({ message: 'Name1 and Name2 are required fields.' });
      }

      // Convert interests string (comma-separated) to array if it's a string
      let interestsArray = interests;
      if (typeof interests === 'string') {
        interestsArray = interests.split(',').map(interest => interest.trim()).filter(interest => interest);
      } else if (!Array.isArray(interests)) {
        interestsArray = []; // Default to empty array if not string or array
      }


      const newProfile = await prisma.coupleProfile.create({
        data: {
          name1,
          name2,
          coupleImageURL,
          bio,
          interests: interestsArray,
          location,
          userId, // Link to the User model
        },
      });
      return res.status(201).json(newProfile);
    } catch (error) {
      console.error('Error creating couple profile:', error);
      // Check for specific Prisma errors if necessary, e.g., unique constraint violation
      // (though userId check should handle most of it)
      return res.status(500).json({ message: 'Internal Server Error while creating profile' });
    }
  } else if (req.method === 'PUT') {
    try {
      const { name1, name2, coupleImageURL, bio, interests, location } = req.body;

      // Validate required fields for update if necessary, or allow partial updates
      if (name1 === '' || name2 === '') { // Example: prevent names from being emptied
          return res.status(400).json({ message: 'Name1 and Name2 cannot be empty.' });
      }

      // Convert interests string (comma-separated) to array if it's a string
      let interestsArray = interests;
      if (typeof interests === 'string') {
        interestsArray = interests.split(',').map(interest => interest.trim()).filter(interest => interest);
      } else if (interests !== undefined && !Array.isArray(interests)) {
        // If interests is provided but not an array (and not undefined), set to empty or handle as error
        interestsArray = [];
      }
      // If interests is undefined, it won't be updated.

      const dataToUpdate = {
        name1,
        name2,
        coupleImageURL,
        bio,
        interests: interestsArray, // This will be undefined if interests was not in req.body, thus not updating it
        location,
      };

      // Remove undefined fields so they don't overwrite existing data with null
      Object.keys(dataToUpdate).forEach(key => dataToUpdate[key] === undefined && delete dataToUpdate[key]);


      const updatedProfile = await prisma.coupleProfile.update({
        where: { userId },
        data: dataToUpdate,
      });
      return res.status(200).json(updatedProfile);
    } catch (error) {
      console.error('Error updating couple profile:', error);
      if (error.code === 'P2025') { // Prisma error code for record not found during update
        return res.status(404).json({ message: 'Couple profile not found to update. Please create one first.' });
      }
      return res.status(500).json({ message: 'Internal Server Error while updating profile' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }
}
