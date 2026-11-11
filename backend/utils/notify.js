module.exports = (resource, incident) =>
  console.log(`[NOTIFY] ${resource.name} (${resource.phone || 'no phone'}) assigned to incident ${incident._id} [${incident.category}, P${incident.priority}]`);
