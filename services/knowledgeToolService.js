const knowledgeSearchService =
    require("./knowledgeSearchService");

exports.execute = async (tenant, message) => {

    const knowledge =
        await knowledgeSearchService.search(
            tenant._id,
            message
        );

    if (!knowledge) {

        return {
            handled: false,
            response: null
        };

    }

    return {

        handled: true,

        response:
            knowledge.answer ||
            knowledge.content ||
            knowledge.text ||
            "Information found."

    };

};