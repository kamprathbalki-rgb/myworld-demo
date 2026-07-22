function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
}

module.exports = function groupLeadAging(buyers = []) {

    const today = startOfDay(new Date());

    const leadGroups = {

        followUpRequired: {
            overdue: [],
            today: [],
            oneToThree: [],
            fourToSeven: [],
            eightPlus: []
        },

        noFollowUpAssigned: {
            new: [],
            fourToSeven: [],
            eightToFifteen: [],
            moreThanFifteen: []
        }

    };

    buyers.forEach(buyer => {

        // Ignore closed/lost buyers just in case
        if (
            buyer.status === 'Deal Closed' ||
            buyer.status === 'Lost'
        ) {
            return;
        }

        // ======================================================
        // FOLLOW-UP REQUIRED
        // ======================================================

        if (buyer.nextFollowUp) {

            const followUp = startOfDay(buyer.nextFollowUp);

            const diffDays = Math.floor(
                (followUp - today) /
                (1000 * 60 * 60 * 24)
            );

            if (diffDays < 0) {

                leadGroups.followUpRequired.overdue.push(buyer);

            } else if (diffDays === 0) {

                leadGroups.followUpRequired.today.push(buyer);

            } else if (diffDays <= 3) {

                leadGroups.followUpRequired.oneToThree.push(buyer);

            } else if (diffDays <= 7) {

                leadGroups.followUpRequired.fourToSeven.push(buyer);

            } else {

                leadGroups.followUpRequired.eightPlus.push(buyer);

            }

            return;
        }

        // ======================================================
        // NO FOLLOW-UP ASSIGNED
        // ======================================================

        if (!buyer.createdAt) {

            leadGroups.noFollowUpAssigned.new.push(buyer);
            return;
        }

        const created = startOfDay(buyer.createdAt);

        const ageDays = Math.floor(
            (today - created) /
            (1000 * 60 * 60 * 24)
        );

        if (ageDays <= 3) {

            leadGroups.noFollowUpAssigned.new.push(buyer);

        } else if (ageDays <= 7) {

            leadGroups.noFollowUpAssigned.fourToSeven.push(buyer);

        } else if (ageDays <= 15) {

            leadGroups.noFollowUpAssigned.eightToFifteen.push(buyer);

        } else {

            leadGroups.noFollowUpAssigned.moreThanFifteen.push(buyer);

        }

    });

    return leadGroups;
};