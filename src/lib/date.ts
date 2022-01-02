var today = new Date();

export default function getDate() {
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    return `${dd}-${mm}-${yyyy}`;
}
