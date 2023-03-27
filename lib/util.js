
export function getImages(item, options) {
  const { saveImage } = options;

  // If image export hasn't been set up for this format, skip it.
  if (!saveImage) return null;

  // No images.
  if (!item.images || item.images.length === 0) return null;

  const images = item.images
      .map(name => {
        const srcset = item.image_srcsets.find(s => s.large.includes(name));
        return srcset ? saveImage(name, srcset.large) : undefined;
      })
      .filter(img => img);

  // Fetch all of the images to the local disk from their large format URLs.
  return { images };
}

export function getProfileImage(user, options) {
  const { saveImage } = options;
  if (!saveImage) return null;
  if (!user.profile_photo) return null;
  let profile_photo = saveImage(user.profile_photo, user.profile_photo_srcset.large);
  return { profile_photo }
}

export function mapUser(user, options) {
  return {
    user_id: user.user_id,
    full_name: user.full_name.replace(' (Account Closed)', ''),
    display_name: user.display_name,
    pronouns: user.pronouns,
    ...getProfileImage(user, options)
  }
}

export function copy(dest, items, key) {
  items.forEach(item => {
    dest[item[[key]]] = item;
  });
}

function toArray(i) {
  return Array.isArray(i) ? i : [i];
}
