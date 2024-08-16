$(document).ready(() => {
    const loadData = () => $.getJSON('data.json');
    const getCards = () => JSON.parse(localStorage.getItem('cardData')) || null;
    const saveCards = cards => localStorage.setItem('cardData', JSON.stringify(cards));

    const actions = ['Áthelyezés', 'Átnevezés', 'Törlés'];
    const actionMap = {
        'Áthelyezés': 'move',
        'Átnevezés': 'rename',
        'Törlés': 'delete'
    };

    const initData = () => {
        loadData().done(fileData => {
            const localData = getCards();
            if (!localData) {
                saveCards(fileData);
                renderCards(fileData);
            } else {
                renderCards(localData);
            }
        });
    };

    const createCard = ({id, image, title, text, items, category, datum}) => {
        const card = $('<div>').addClass('col');
        const cardInner = $('<div>').addClass('card h-100 position-relative d-flex flex-column')
            .append($('<span>').addClass('badge bg-secondary position-absolute top-0 end-0 m-2 opacity-75').text(`ID: ${id}`))
            .append($('<div>').addClass('imgContainer bg-light d-flex align-items-center justify-content-center overflow-hidden')
                .append(image ? $('<img>').addClass('card-img-top hasImg').attr({src: image, alt: title}) : $('<span>').addClass('fst-italic').text('Nincs kép')))
            .append($('<div>').addClass('card-body p-0 d-flex flex-column')
                .append($('<div>').addClass('title d-flex justify-content-between align-items-center px-2 py-0')
                    .append($('<h5>').addClass('card-title m-0').text(title))
                    .append($('<button>').addClass('btn btn-success btn-sm add-item-btn m-2').text('+').data('id', id)))
                .append($('<p>').addClass('card-text text-muted small details px-2 py-1 border-bottom mb-0')
                    .html(`Kategória: <span class="fw-bold">${category || 'N/A'}</span> | Dátum: <span class="fw-bold">${datum || 'N/A'}</span>`))
                .append(text ? $('<p>').addClass('card-text px-2').text(text) : '')
                .append($('<div>').addClass('items-container flex-grow-1')
                    .append(items && items.length ? $('<ul>').addClass('list-group list-group-flush').append(
                        items.map((item, index) => $('<li>').addClass('list-group-item d-flex justify-content-between align-items-center border-0 border-bottom')
                            .text(item).append(ItemDropdown(id, index)))
                    ) : '')))
            .append($('<div>').addClass('card-footer bg-transparent border-0 mt-auto')
                .append($('<div>').addClass('d-flex justify-content-start')
                    .append($('<button>').addClass('btn btn-primary me-2 modify-btn').text('Módosítás').data('id', id))
                    .append($('<button>').addClass('btn btn-danger delete-btn').text('Törlés').data('id', id))));
        return card.append(cardInner);
    };
    const ItemDropdown = (cardId, itemIndex) => {
        const dropdown = $('<div>').addClass('dropdown');
        const button = $('<button>').addClass('btn btn-sm btn-secondary dropdown-toggle').attr({
            type: 'button', 'data-bs-toggle': 'dropdown', 'aria-expanded': 'false'
        });
        const menu = $('<ul>').addClass('dropdown-menu');
        actions.forEach(action => {
            menu.append($('<li>').append($('<a>').addClass(`dropdown-item ${actionMap[action]}-item`)
                .attr('href', '#').text(action).data({cardId, itemIndex})));
        });
        return dropdown.append(button).append(menu);
    };

    const renderCards = cards => $('#cardContainer').empty().append(cards.map(createCard));

    const modifyCard = (id, prop, prompt) => {
        const cards = getCards();
        const card = cards.find(c => c.id === id);
        const newValue = window.prompt(prompt, card[prop]);
        if (newValue !== null) {
            card[prop] = newValue;
            saveCards(cards);
            renderCards(cards);
        }
    };

    const deleteCard = id => {
        if (confirm("Biztosan törölni szeretné ezt a kártyát?")) {
            const cards = getCards().filter(c => c.id !== id);
            saveCards(cards);
            renderCards(cards);
        }
    };

    const moveItem = (cardId, itemIndex) => {
        const cards = getCards();
        const sourceCard = cards.find(c => c.id === cardId);
        const item = sourceCard.items[itemIndex];
        const targetOptions = cards.filter(c => c.id !== cardId).map(c => `${c.id}: ${c.title}`).join('\n');
        const targetCardId = prompt(`Hova szeretné áthelyezni? \n${targetOptions}`);
        if (targetCardId === null) return;
        const targetCard = cards.find(c => c.id === Number(targetCardId));
        if (targetCard) {
            sourceCard.items.splice(itemIndex, 1);
            targetCard.items.push(item);
            saveCards(cards);
            renderCards(cards);
        } else {
            alert("Érvénytelen ID");
        }
    };

    const modifyItem = (cardId, itemIndex, action) => {
        const cards = getCards();
        const card = cards.find(c => c.id === cardId);
        if (action === 'rename') {
            const newName = prompt("Új cím:", card.items[itemIndex]);
            if (newName !== null) card.items[itemIndex] = newName;
        } else if (action === 'delete' && confirm("Biztosan törölni szeretné az elemet?")) {
            card.items.splice(itemIndex, 1);
        }
        saveCards(cards);
        renderCards(cards);
    };

    const addItem = (cardId) => {
        const cards = getCards();
        const card = cards.find(c => c.id === cardId);
        const newItem = prompt("Adja meg az új elem nevét:");
        if (newItem !== null && newItem.trim() !== "") {
            card.items = card.items || [];
            card.items.push(newItem.trim());
            saveCards(cards);
            renderCards(cards);
        }
    };

    initData();

    $(document)
        .on('click', '.modify-btn', e => modifyCard($(e.target).data('id'), 'title', "Adja meg az új címet:"))
        .on('click', '.delete-btn', e => deleteCard($(e.target).data('id')))
        .on('click', '.move-item', e => moveItem($(e.target).data('cardId'), $(e.target).data('itemIndex')))
        .on('click', '.rename-item', e => modifyItem($(e.target).data('cardId'), $(e.target).data('itemIndex'), 'rename'))
        .on('click', '.delete-item', e => modifyItem($(e.target).data('cardId'), $(e.target).data('itemIndex'), 'delete'))
        .on('click', '.add-item-btn', e => addItem($(e.target).data('id')));

    $('#reloadData').on('click', () => {
        if (confirm("Biztosan vissza szeretné állítani az adatokat?")) {
            loadData().done(fileData => {
                saveCards(fileData);
                renderCards(fileData);
            });
        }
    });

    $('#newElement').on('show.bs.modal', () => $('#newForm')[0].reset());
    $('#createButton').on('click', () => {
        const cards = getCards();
        const title = $('#cim').val().trim();
        const category = $('#temakor').val().trim();
        const datum = $('#datum').val();
        const imageFile = $('#kep')[0].files[0];

        if (title && category && datum) {
            handleImageUpload(imageFile).then(imageData => {
                const newCard = {
                    id: cards.length + 1,
                    title: title,
                    category: category,
                    datum: datum,
                    image: imageData,
                    items: []
                };

                cards.push(newCard);
                saveCards(cards);
                renderCards(cards);
                $('#newElement').modal('hide');
            });
        } else {
            alert('Kérjük, töltse ki az összes kötelező mezőt!');
        }
    });

    function handleImageUpload(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                resolve('');
                return;
            }

            const reader = new FileReader();
            reader.onload = event => {
                resolve(event.target.result);
            };
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }
});