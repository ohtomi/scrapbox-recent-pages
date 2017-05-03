class PageMetadata {

    constructor(baseUrl, project, title, image, updated, accessed) {
        this.baseUrl = baseUrl;
        this.project = project;
        this.title = title;
        this.image = image;
        this.updated = updated;
        this.accessed = accessed;

        if (this.baseUrl.substring(this.baseUrl.length - 1) === '/') {
            this.baseUrl = this.baseUrl.substring(0, this.baseUrl.length - 1);
        }
    }
}
