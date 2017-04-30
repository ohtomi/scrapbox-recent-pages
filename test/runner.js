const assertRecentPages = (actual, expected) => {

    if (actual.length !== expected.length) {
        return false;
    }

    return expected
        .map((element, index, array) => {
            let a = actual[index];
            if (!a) {
                return false;
            }
            let e = element;
            return a.baseUrl === e.baseUrl && a.project === e.project && a.title === e.title;
        })
        .every(value => {
            return value;
        });
};

//
(() => {
    let actual = filterRecentPages([], 5, 'total');

    if (actual.length !== 0) {
        console.error('FAIL', 'test empty list', actual);
    }
})();

//
(() => {
    let actual = filterRecentPages(
        [
            {baseUrl: 'baseUrl1', project: 'project1', pages: [{title: 'title1', updated: '1006'}]},
            {baseUrl: 'baseUrl2', project: 'project2', pages: [{title: 'title2', updated: '1005'}]},
            {baseUrl: 'baseUrl3', project: 'project3', pages: [{title: 'title3', updated: '1004'}]},
            {baseUrl: 'baseUrl4', project: 'project4', pages: [{title: 'title4', updated: '1003'}]},
            {baseUrl: 'baseUrl5', project: 'project5', pages: [{title: 'title5', updated: '1002'}]},
            {baseUrl: 'baseUrl6', project: 'project6', pages: [{title: 'title6', updated: '1001'}]}
        ], 5, 'total');
    let expected = [
        {baseUrl: 'baseUrl1', project: 'project1', title: 'title1', updated: '1006'},
        {baseUrl: 'baseUrl2', project: 'project2', title: 'title2', updated: '1005'},
        {baseUrl: 'baseUrl3', project: 'project3', title: 'title3', updated: '1004'},
        {baseUrl: 'baseUrl4', project: 'project4', title: 'title4', updated: '1003'},
        {baseUrl: 'baseUrl5', project: 'project5', title: 'title5', updated: '1002'}
    ];

    if (!assertRecentPages(actual, expected)) {
        console.error('FAIL', 'test filter by total', actual, expected);
    }
})();

//
(() => {
    let actual = filterRecentPages(
        [
            {baseUrl: 'baseUrl1', project: 'project1', pages: [{title: 'title1', updated: '1006'}]},
            {baseUrl: 'baseUrl1', project: 'project2', pages: [{title: 'title2', updated: '1005'}]},
            {baseUrl: 'baseUrl1', project: 'project3', pages: [{title: 'title3', updated: '1004'}]},
            {baseUrl: 'baseUrl1', project: 'project4', pages: [{title: 'title4', updated: '1003'}]},
            {baseUrl: 'baseUrl1', project: 'project5', pages: [{title: 'title5', updated: '1002'}]},
            {baseUrl: 'baseUrl1', project: 'project6', pages: [{title: 'title6', updated: '1001'}]}
        ], 5, 'host');
    let expected = [
        {baseUrl: 'baseUrl1', project: 'project1', title: 'title1', updated: '1006'},
        {baseUrl: 'baseUrl1', project: 'project2', title: 'title2', updated: '1005'},
        {baseUrl: 'baseUrl1', project: 'project3', title: 'title3', updated: '1004'},
        {baseUrl: 'baseUrl1', project: 'project4', title: 'title4', updated: '1003'},
        {baseUrl: 'baseUrl1', project: 'project5', title: 'title5', updated: '1002'}
    ];

    if (!assertRecentPages(actual, expected)) {
        console.error('FAIL', 'test filter by host', actual, expected);
    }
})();
