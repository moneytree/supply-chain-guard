# Registries

## Internal API requirements

Each registry must export the following properties and APIs:

### `async getPublishTime(logger: Logger, pkg: Package) -> integer`

Given a Package object from the array returned by `parser.listPackages`, this API must attempt to discover the publication time from an online service that can be queried for this information. If a service is used, a simple cache should be implemented within the system's code to prevent looking up the same package/version more than once in a single scan.
